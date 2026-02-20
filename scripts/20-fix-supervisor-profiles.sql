-- Script para recuperar usuarios supervisor que fallaron en la creación
-- Este script identifica usuarios autenticados sin perfil en la tabla users

-- Insertar perfiles faltantes solo para usuarios que NO existen
INSERT INTO users (email, username, first_name, last_name, role, is_active, created_at, updated_at)
SELECT 
  au.email,
  SPLIT_PART(au.email, '@', 1) || '_' || substr(au.id::text, 1, 4) as username,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Usuario'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'Supervisor'),
  'supervisor' as role,
  true as is_active,
  au.created_at,
  NOW()
FROM auth.users au
WHERE 
  NOT EXISTS (SELECT 1 FROM users u WHERE u.email = au.email)
  AND au.email LIKE '%@%'
ON CONFLICT DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT email, role, is_active FROM users WHERE role = 'supervisor' ORDER BY created_at DESC;
