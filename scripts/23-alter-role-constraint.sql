-- Actualizar el CHECK constraint de la tabla users para incluir 'supervisor'
-- Primero, eliminar el constraint existente
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Luego, agregar el nuevo constraint con 'supervisor' incluido
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin'));

-- Verificar que el constraint fue actualizado
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name = 'users_role_check';
