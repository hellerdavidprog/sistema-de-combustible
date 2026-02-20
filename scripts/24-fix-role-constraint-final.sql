-- Eliminar el constraint existente
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Recrear el constraint con 'supervisor' incluido
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin'));

-- Verificar que el constraint se actualizó correctamente
SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name = 'users_role_check';
