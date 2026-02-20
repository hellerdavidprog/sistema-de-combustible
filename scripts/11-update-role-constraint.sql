-- Actualizar el constraint de la tabla users para permitir el rol 'operator'

-- 1. Eliminar el constraint antiguo
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Crear el nuevo constraint con admin y operator
ALTER TABLE public.users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'operator'));

-- 3. Actualizar el valor por defecto
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'operator';

-- 4. Verificar el constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname = 'users_role_check';
