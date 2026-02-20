-- ============================================
-- CREAR USUARIOS EN SUPABASE
-- ============================================
-- Esquema actual: id, email, full_name, role, is_active, telegram_id

-- IMPORTANTE: No podemos insertar directamente en auth.users desde SQL Editor.
-- Debes crear estos usuarios manualmente desde el Dashboard de Supabase:

-- 1. Ve a Authentication > Users en tu proyecto de Supabase
-- 2. Haz clic en "Add user" > "Create new user"
-- 3. Crear el usuario ADMIN:
--    - Email: admin@estelar.com
--    - Password: 12345
--    - Auto Confirm User: ON (activado)
--
-- 4. Crear el usuario OPERADOR:
--    - Email: operador@estelar.com
--    - Password: 12345
--    - Auto Confirm User: ON (activado)

-- Verificar que los usuarios fueron creados correctamente
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email IN ('admin@estelar.com', 'operador@estelar.com');

-- Si los usuarios existen en auth.users pero no en public.users, ejecuta esto:
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'role', 'operator'),
  true
FROM auth.users
WHERE email IN ('admin@estelar.com', 'operador@estelar.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = true;
