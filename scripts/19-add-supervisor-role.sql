-- Agregar soporte para el rol 'supervisor' al constraint users_role_check

-- 1. Eliminar el constraint antiguo
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Crear el nuevo constraint con admin, operator y supervisor
ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'operator', 'supervisor'));

-- 3. Verificar el constraint actualizado
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';
