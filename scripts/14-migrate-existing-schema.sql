-- ============================================
-- MIGRATION: Update existing schema to new structure
-- ============================================
-- This script safely migrates an existing database to the new schema
-- It handles cases where tables exist with different column structures

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Check and update users table
-- ============================================

-- Ensure users table exists with correct structure
DO $$
BEGIN
  -- Check if users table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    -- Create users table if it doesn't exist
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      telegram_id BIGINT UNIQUE,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created users table';
  ELSE
    -- Add missing columns to existing table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
      ALTER TABLE public.users ADD COLUMN email TEXT;
      RAISE NOTICE 'Added email column to users';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_active') THEN
      ALTER TABLE public.users ADD COLUMN is_active BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added is_active column to users';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 2: Check and update fuel_receipts table
-- ============================================

DO $$
BEGIN
  -- Check if fuel_receipts table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fuel_receipts') THEN
    -- Create fuel_receipts table if it doesn't exist
    CREATE TABLE public.fuel_receipts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      telegram_id BIGINT,
      date DATE NOT NULL,
      time TIME NOT NULL,
      aircraft_registration TEXT,
      supplier TEXT,
      initial_reading INTEGER,
      final_reading INTEGER,
      liters_dispensed DECIMAL(10, 2) NOT NULL,
      origin TEXT,
      destination TEXT,
      notes TEXT,
      receipt_image_url TEXT,
      receipt_number TEXT,
      operation_type TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    RAISE NOTICE 'Created fuel_receipts table';
  ELSE
    -- Add missing columns to existing table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'aircraft_registration') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN aircraft_registration TEXT;
      RAISE NOTICE 'Added aircraft_registration column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'supplier') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN supplier TEXT;
      RAISE NOTICE 'Added supplier column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'initial_reading') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN initial_reading INTEGER;
      RAISE NOTICE 'Added initial_reading column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'final_reading') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN final_reading INTEGER;
      RAISE NOTICE 'Added final_reading column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'origin') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN origin TEXT;
      RAISE NOTICE 'Added origin column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'destination') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN destination TEXT;
      RAISE NOTICE 'Added destination column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'receipt_number') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN receipt_number TEXT;
      RAISE NOTICE 'Added receipt_number column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'operation_type') THEN
      ALTER TABLE public.fuel_receipts ADD COLUMN operation_type TEXT;
      RAISE NOTICE 'Added operation_type column';
    END IF;
    
    -- Make user_id nullable for public submissions
    ALTER TABLE public.fuel_receipts ALTER COLUMN user_id DROP NOT NULL;
    RAISE NOTICE 'Made user_id nullable';
  END IF;
END $$;

-- ============================================
-- STEP 3: Create audit_log table if needed
-- ============================================

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

-- ============================================
-- STEP 4: Create indexes (only if columns exist)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_date ON public.fuel_receipts(date);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Only create these indexes if the columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_receipts_user_id ON public.fuel_receipts(user_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'telegram_id') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_receipts_telegram_id ON public.fuel_receipts(telegram_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'aircraft_registration') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_receipts_aircraft ON public.fuel_receipts(aircraft_registration);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'origin') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_receipts_origin ON public.fuel_receipts(origin);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_receipts' AND column_name = 'destination') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_receipts_destination ON public.fuel_receipts(destination);
  END IF;
END $$;

-- ============================================
-- STEP 5: Create updated_at trigger function
-- ============================================

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

-- ============================================
-- STEP 6: Enable Row Level Security
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 7: Drop all existing policies and recreate
-- ============================================

-- Drop existing policies for users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Allow public read for first admin check" ON public.users;

-- Drop existing policies for fuel_receipts
DROP POLICY IF EXISTS "Admins and operators can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Anyone can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Admins can delete receipts" ON public.fuel_receipts;

-- Drop existing policies for audit_log
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create users policies
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Allow checking if any admin exists (for bootstrap)
CREATE POLICY "Allow public read for first admin check"
  ON public.users FOR SELECT
  USING (true);

-- Create fuel_receipts policies - ANYONE CAN INSERT (public form)
CREATE POLICY "Anyone can insert receipts"
  ON public.fuel_receipts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and operators can view all receipts"
  ON public.fuel_receipts FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('admin', 'operator'))
  );

CREATE POLICY "Only admins can update receipts"
  ON public.fuel_receipts FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "Only admins can delete receipts"
  ON public.fuel_receipts FOR DELETE
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- Create audit_log policies
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STEP 8: Create function to auto-create user profile
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, telegram_id, username, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'telegram_id')::BIGINT, NULL),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'operator')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-creating user profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Migration completed successfully!' as status;

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'fuel_receipts', 'audit_log')
ORDER BY table_name, ordinal_position;
