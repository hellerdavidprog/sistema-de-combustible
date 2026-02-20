-- ============================================
-- FIX USER CREATION
-- ============================================
-- Esquema actual: id, email, full_name, role, is_active, telegram_id

-- PASO 1: ELIMINAR EL TRIGGER PROBLEMÁTICO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- PASO 2: VE AL DASHBOARD Y CREA LOS USUARIOS
-- Dashboard de Supabase > Authentication > Users > Add User
-- 
-- Usuario 1:
--   Email: admin@estelar.com
--   Password: 12345
--   Auto Confirm User: ON
--
-- Usuario 2:
--   Email: operador@estelar.com
--   Password: 12345
--   Auto Confirm User: ON
--
-- Después de crear ambos usuarios, ejecuta el PASO 3

-- PASO 3: CREAR LOS PERFILES MANUALMENTE
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  'Administrador Sistema',
  'admin',
  true
FROM auth.users
WHERE email = 'admin@estelar.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin', 
    full_name = EXCLUDED.full_name,
    is_active = true;

INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  'Operador Sistema',
  'operator',
  true
FROM auth.users
WHERE email = 'operador@estelar.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'operator',
    full_name = EXCLUDED.full_name,
    is_active = true;

-- PASO 4: VERIFICAR QUE TODO ESTÉ CORRECTO
SELECT 
  u.id,
  au.email,
  u.full_name,
  u.role,
  u.is_active
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email IN ('admin@estelar.com', 'operador@estelar.com');

-- PASO 5: RECREAR EL TRIGGER CON EL ESQUEMA CORRECTO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'role', 'operator'),
      true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
