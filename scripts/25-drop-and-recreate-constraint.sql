-- Drop existing constraint and recreate with supervisor role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin'));

-- Verify constraint
SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_type = 'CHECK';
