-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

DROP POLICY IF EXISTS "Admins and operators can view all receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can insert receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can update receipts" ON public.fuel_receipts;
DROP POLICY IF EXISTS "Only admins can delete receipts" ON public.fuel_receipts;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create a function to get user role from JWT custom claims
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try to get role from raw_user_meta_data in auth.users
  SELECT raw_user_meta_data->>'role' INTO user_role
  FROM auth.users
  WHERE id = auth.uid();
  
  -- If no role found, try from public.users with RLS disabled
  IF user_role IS NULL THEN
    SELECT role INTO user_role
    FROM public.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN COALESCE(user_role, 'operator');
END;
$$;

-- Simpler RLS Policies using the function (no recursion)

-- Users table policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (get_user_role() = 'admin');

-- Fuel receipts policies - Allow anyone authenticated to view and insert
CREATE POLICY "Authenticated users can view receipts"
  ON public.fuel_receipts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert receipts"
  ON public.fuel_receipts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update receipts"
  ON public.fuel_receipts FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete receipts"
  ON public.fuel_receipts FOR DELETE
  USING (get_user_role() = 'admin');

-- Audit log policies
CREATE POLICY "Admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (get_user_role() = 'admin');

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- Update the handle_new_user function to also store role in user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get the role from metadata, default to 'operator'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'operator');
  
  -- Insert into public.users
  INSERT INTO public.users (id, telegram_id, username, first_name, last_name, email, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'telegram_id')::BIGINT, NULL),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
