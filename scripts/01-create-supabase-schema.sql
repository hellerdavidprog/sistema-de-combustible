-- ============================================
-- ESQUEMA PRINCIPAL DE LA BASE DE DATOS
-- ============================================
-- Este script crea las tablas principales usando el esquema actualizado
-- Columnas: id, email, full_name, role, is_active

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users profile table (references auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated fuel_receipts table with aircraft-specific fields
CREATE TABLE IF NOT EXISTS public.fuel_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Receipt identification
  receipt_number TEXT,
  operation_type TEXT CHECK (operation_type IN ('Carga', 'Descarga')),
  
  -- Receipt details
  date DATE NOT NULL,
  time TIME,
  
  -- Aircraft-specific fields
  aircraft_registration TEXT CHECK (aircraft_registration IN ('YV666T', 'YV657T', 'YV2792', 'YV630T', 'YV642T')),
  supplier TEXT CHECK (supplier IN ('PDVSA', 'Commerchamp')),
  initial_reading INTEGER,
  final_reading INTEGER,
  liters_dispensed DECIMAL(10, 2),
  liters DECIMAL(10, 2),
  price_per_liter DECIMAL(10, 4),
  total_amount DECIMAL(12, 2),
  currency TEXT DEFAULT 'USD',
  origin TEXT CHECK (origin IN ('CCS', 'BNS', 'MAD', 'MAR', 'STB', 'STD', 'SVZ', 'PMV', 'PTY', 'PZO')),
  destination TEXT CHECK (destination IN ('CCS', 'BNS', 'MAD', 'MAR', 'STB', 'STD', 'SVZ', 'PMV', 'PTY', 'PZO')),
  airport_code TEXT,
  flight_number TEXT,
  pilot_name TEXT,
  
  -- Optional fields
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Image storage (Supabase Storage)
  receipt_image_url TEXT,
  image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_user_id ON public.fuel_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_date ON public.fuel_receipts(date);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_aircraft ON public.fuel_receipts(aircraft_registration);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_origin ON public.fuel_receipts(origin);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_destination ON public.fuel_receipts(destination);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fuel_receipts_updated_at ON public.fuel_receipts;
CREATE TRIGGER update_fuel_receipts_updated_at 
  BEFORE UPDATE ON public.fuel_receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins and operators can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- RLS Policies for users table
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for fuel_receipts
CREATE POLICY "Admins and operators can view all receipts"
  ON public.fuel_receipts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'operator', 'super_admin'))
  );

CREATE POLICY "Anyone can insert receipts"
  ON public.fuel_receipts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can update receipts"
  ON public.fuel_receipts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "Only admins can delete receipts"
  ON public.fuel_receipts FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for audit_log table
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Create function to auto-create user profile (using email/full_name schema)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name);
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
