-- Script para crear usuarios manualmente en public.users
-- Esquema actual: id, email, full_name, role, is_active, telegram_id

-- IMPORTANTE: Primero debes crear los usuarios en Supabase Dashboard > Authentication > Users
-- Luego ejecuta este script para crear sus perfiles en public.users

-- 1. Verifica la estructura de la tabla users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Busca los IDs de los usuarios creados en auth.users
SELECT id, email FROM auth.users WHERE email IN ('admin@estelar.com', 'operador@estelar.com');

-- 3. Crea los perfiles en public.users

-- Para el admin:
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  'Admin Estelar',
  'admin',
  true
FROM auth.users 
WHERE email = 'admin@estelar.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Para el operador:
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT 
  id,
  email,
  'Operador Estelar',
  'operator',
  true
FROM auth.users 
WHERE email = 'operador@estelar.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 4. Verifica que los usuarios fueron creados correctamente
SELECT id, email, full_name, role, is_active FROM public.users;
