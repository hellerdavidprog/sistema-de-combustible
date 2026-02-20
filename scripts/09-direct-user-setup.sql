-- ============================================
-- CREACIÓN DIRECTA DE USUARIOS (PASO A PASO)
-- ============================================
-- Esquema actualizado: email, full_name (sin username, first_name, last_name)

-- PASO 1: Deshabilitar el trigger problemático temporalmente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- PASO 2: Crear usuario ADMIN manualmente
-- Primero necesitas ir al Dashboard de Supabase > Authentication > Users
-- Y crear manualmente el usuario con estos datos:
-- Email: admin@estelar.com
-- Password: 12345
-- Auto Confirm User: ACTIVADO (checkbox marcado)

-- Después de crear el usuario en el Dashboard, ejecuta esto:

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar el ID del usuario admin por email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@estelar.com';
  
  IF admin_user_id IS NULL THEN
    RAISE NOTICE 'Usuario admin@estelar.com no existe. Créalo primero en el Dashboard de Supabase o usa la app.';
  ELSE
    -- Crear perfil en public.users
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (admin_user_id, 'admin@estelar.com', 'Administrador Sistema', 'admin', true)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    
    RAISE NOTICE 'Usuario admin creado exitosamente con ID: %', admin_user_id;
  END IF;
END $$;

-- PASO 3: Crear usuario OPERADOR manualmente
-- Ir al Dashboard de Supabase > Authentication > Users
-- Y crear manualmente el usuario con estos datos:
-- Email: operador@estelar.com
-- Password: 12345
-- Auto Confirm User: ACTIVADO (checkbox marcado)

DO $$
DECLARE
  operator_user_id UUID;
BEGIN
  -- Buscar el ID del usuario operador por email
  SELECT id INTO operator_user_id FROM auth.users WHERE email = 'operador@estelar.com';
  
  IF operator_user_id IS NULL THEN
    RAISE NOTICE 'Usuario operador@estelar.com no existe. Créalo primero en el Dashboard de Supabase o usa la app.';
  ELSE
    -- Crear perfil en public.users
    INSERT INTO public.users (id, email, full_name, role, is_active)
    VALUES (operator_user_id, 'operador@estelar.com', 'Operador Sistema', 'operator', true)
    ON CONFLICT (id) DO UPDATE 
    SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, role = EXCLUDED.role;
    
    RAISE NOTICE 'Usuario operador creado exitosamente con ID: %', operator_user_id;
  END IF;
END $$;

-- PASO 4: Verificar que los usuarios fueron creados correctamente
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active
FROM public.users u
WHERE u.email IN ('admin@estelar.com', 'operador@estelar.com');

-- PASO 5: Reactivar el trigger para futuros usuarios
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FIN - Los usuarios deben estar listos ahora
-- ============================================
