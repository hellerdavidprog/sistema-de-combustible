-- Script para crear el usuario admin inicial
-- INSTRUCCIONES: Ejecuta este script DESPUÉS de crear el usuario en Supabase Auth

-- El esquema actual usa: id, email, full_name, role, is_active, telegram_id

-- PASO 1: Ve a Authentication > Users en Supabase Dashboard
-- PASO 2: Crea un nuevo usuario con:
--         Email: admin@estelar.com
--         Password: estelar2025
-- PASO 3: Ejecuta este script para crear el perfil

UPDATE public.users 
SET role = 'admin', 
    full_name = 'Admin Estelar',
    is_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@estelar.com' LIMIT 1);

-- Si el usuario no existe en public.users, créalo:
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
  role = 'admin',
  full_name = EXCLUDED.full_name,
  is_active = true;

-- Verificar resultado
SELECT id, email, full_name, role, is_active FROM public.users;
