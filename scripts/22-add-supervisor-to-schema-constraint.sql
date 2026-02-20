-- Migración para actualizar el CHECK constraint de la columna role en users
-- Agregar soporte al rol 'supervisor'

-- Primero, eliminar el constraint existente
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Luego, agregar el nuevo constraint que incluye 'supervisor'
ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin'));

-- Verificar que el cambio se aplicó correctamente
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name LIKE '%role%';
