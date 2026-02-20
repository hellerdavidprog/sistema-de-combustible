-- ============================================
-- CONFIGURAR PERMISOS PARA RECIBOS PÚBLICOS
-- ============================================
-- Este script configura las políticas RLS para permitir
-- el envío de recibos desde el formulario web público

-- PASO 1: Permitir user_id NULL para envíos públicos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'fuel_receipts' 
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.fuel_receipts ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE 'user_id ahora permite NULL';
  END IF;
END $$;

-- PASO 2: Eliminar políticas existentes para evitar duplicados
DROP POLICY IF EXISTS "Users can insert own receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Users can view own receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Users can delete own receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins and operators can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can delete receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.fuel_receipts;

-- PASO 3: Crear nuevas políticas RLS

-- Permitir a cualquiera insertar recibos (formulario público)
CREATE POLICY "Anyone can insert receipts"
  ON public.fuel_receipts FOR INSERT
  WITH CHECK (true);

-- Admins y operadores pueden ver todos los recibos
CREATE POLICY "Admins and operators can view all receipts"
  ON public.fuel_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('admin', 'operator')
    )
  );

-- Solo admins pueden actualizar recibos
CREATE POLICY "Only admins can update receipts"
  ON public.fuel_receipts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Solo admins pueden eliminar recibos
CREATE POLICY "Only admins can delete receipts"
  ON public.fuel_receipts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- PASO 4: Verificar políticas creadas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'fuel_receipts';
