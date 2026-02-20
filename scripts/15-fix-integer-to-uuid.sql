-- ============================================
-- FIX: Migrar users.id de INTEGER a UUID
-- ============================================
-- Este script corrige el problema de tipos donde
-- users.id es INTEGER pero debería ser UUID para
-- conectarse con auth.users(id)

-- PASO 1: Eliminar todas las políticas RLS existentes que causan el error
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins and operators can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can delete receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.fuel_receipts;

-- PASO 2: Deshabilitar RLS temporalmente para evitar errores
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fuel_receipts DISABLE ROW LEVEL SECURITY;

-- PASO 3: Hacer backup de datos existentes de users
CREATE TABLE IF NOT EXISTS public.users_backup AS 
SELECT * FROM public.users;

-- PASO 4: Eliminar tabla users existente con dependencias
DROP TABLE IF EXISTS public.users CASCADE;

-- PASO 5: Recrear tabla users con id UUID correctamente
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  telegram_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 6: Habilitar RLS en users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASO 7: Crear políticas RLS para users
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage users"
  ON public.users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- PASO 8: Asegurar que fuel_receipts tiene la estructura correcta
-- Primero verificar y actualizar la columna user_id si es necesario
DO $$
BEGIN
  -- Si fuel_receipts existe y user_id es integer, necesitamos recrear
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fuel_receipts' 
      AND column_name = 'user_id' 
      AND data_type = 'integer'
  ) THEN
    -- Hacer backup
    CREATE TABLE IF NOT EXISTS public.fuel_receipts_backup AS 
    SELECT * FROM public.fuel_receipts;
    
    -- Eliminar y recrear
    DROP TABLE IF EXISTS public.fuel_receipts CASCADE;
    
    CREATE TABLE public.fuel_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
      receipt_number TEXT,
      operation_type TEXT CHECK (operation_type IN ('fuel', 'defuel', 'return')),
      date DATE NOT NULL,
      aircraft_registration TEXT,
      liters DECIMAL(10,2) NOT NULL,
      price_per_liter DECIMAL(10,4),
      total_amount DECIMAL(12,2),
      currency TEXT DEFAULT 'USD',
      supplier TEXT,
      airport_code TEXT,
      flight_number TEXT,
      pilot_name TEXT,
      origin TEXT,
      destination TEXT,
      image_url TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- PASO 9: Si fuel_receipts no existe, crearlo
CREATE TABLE IF NOT EXISTS public.fuel_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  receipt_number TEXT,
  operation_type TEXT CHECK (operation_type IN ('fuel', 'defuel', 'return')),
  date DATE NOT NULL,
  aircraft_registration TEXT,
  liters DECIMAL(10,2) NOT NULL,
  price_per_liter DECIMAL(10,4),
  total_amount DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  supplier TEXT,
  airport_code TEXT,
  flight_number TEXT,
  pilot_name TEXT,
  origin TEXT,
  destination TEXT,
  image_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 10: Habilitar RLS en fuel_receipts
ALTER TABLE public.fuel_receipts ENABLE ROW LEVEL SECURITY;

-- PASO 11: Crear políticas RLS para fuel_receipts
CREATE POLICY "Anyone can insert receipts"
  ON public.fuel_receipts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and operators can view all receipts"
  ON public.fuel_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );

CREATE POLICY "Only admins can update receipts"
  ON public.fuel_receipts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete receipts"
  ON public.fuel_receipts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- PASO 12: Crear índices
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_date ON public.fuel_receipts(date);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_status ON public.fuel_receipts(status);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_user_id ON public.fuel_receipts(user_id);

-- PASO 13: Crear o actualizar función para timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 14: Crear triggers para updated_at
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_fuel_receipts_updated_at ON public.fuel_receipts;
CREATE TRIGGER set_fuel_receipts_updated_at
  BEFORE UPDATE ON public.fuel_receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- PASO 15: Crear función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASO 16: Crear trigger para nuevos usuarios de auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 17: Mostrar resumen
SELECT 'Schema actualizado correctamente' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'fuel_receipts')
ORDER BY table_name, ordinal_position;
