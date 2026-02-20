-- Crear perfil del operador en public.users
-- Esquema actual: id, email, full_name, role, is_active, telegram_id

INSERT INTO public.users (
  id, 
  email,
  full_name,
  role, 
  is_active
)
SELECT 
  id,
  email,
  'Operador Sistema',
  'operator',
  true
FROM auth.users 
WHERE email = 'operador@estelar.com'
ON CONFLICT (id) DO UPDATE 
SET 
  role = EXCLUDED.role,
  full_name = EXCLUDED.full_name;

-- Verificar que se creó correctamente
SELECT u.id, u.email, u.full_name, u.role, u.is_active
FROM public.users u
WHERE u.email IN ('admin@estelar.com', 'operador@estelar.com');
