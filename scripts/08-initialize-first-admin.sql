-- Script para sincronizar perfiles de usuarios existentes en auth.users
-- Esquema actual: id, email, full_name, role, is_active
-- NOTA: Solo sincroniza usuarios que YA existen en auth.users (debido a FK constraint)

-- PASO 1: Eliminar el trigger si causa problemas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASO 2: Sincronizar perfiles desde auth.users a public.users
DO $$
DECLARE
  auth_user RECORD;
  user_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos los usuarios en auth.users
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users
  LOOP
    -- Insertar o actualizar el perfil
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(
        auth_user.raw_user_meta_data->>'full_name',
        auth_user.raw_user_meta_data->>'name',
        split_part(auth_user.email, '@', 1)
      ),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'operator'),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      is_active = true;
    
    user_count := user_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Sincronizados % usuarios desde auth.users', user_count;
END $$;

-- PASO 3: Promover el primer usuario a admin si no hay admins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin') THEN
    UPDATE public.users
    SET role = 'admin'
    WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);
    
    RAISE NOTICE 'Primer usuario promovido a admin';
  ELSE
    RAISE NOTICE 'Ya existe al menos un admin';
  END IF;
END $$;

-- PASO 3: Recrear el trigger con el esquema correcto
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
