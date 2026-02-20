-- Verificar estado de usuarios supervisor
SELECT 
  id,
  email,
  username,
  role,
  is_active,
  created_at,
  updated_at
FROM users
WHERE email = 'samuel.gapo@flyestelar.com'
ORDER BY created_at DESC;

-- Ver todos los usuarios supervisor activos
SELECT 
  COUNT(*) as total_supervisors,
  COUNT(CASE WHEN is_active THEN 1 END) as active_supervisors
FROM users
WHERE role = 'supervisor';

-- Ver si hay duplicados de email
SELECT 
  email,
  COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;
