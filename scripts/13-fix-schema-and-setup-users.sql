-- ============================================
-- SCRIPT CONSOLIDADO: ARREGLAR ESQUEMA Y CREAR USUARIOS
-- ============================================
-- Esquema actual: id, email, full_name, role, is_active, telegram_id

-- PASO 1: Actualizar el constraint de role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
  ) THEN
    -- Eliminar constraint antiguo si existe
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Crear nuevo constraint
    ALTER TABLE public.users 
      ADD CONSTRAINT users_role_check 
      CHECK (role IN ('admin', 'operator', 'super_admin'));
    
    RAISE NOTICE 'Constraint de role actualizado correctamente.';
  END IF;
END $$;

-- PASO 2: Eliminar y recrear el trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 3: Crear perfiles para usuarios existentes en auth.users
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

-- PASO 4: Verificar resultado
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active
FROM public.users u
ORDER BY u.created_at;
