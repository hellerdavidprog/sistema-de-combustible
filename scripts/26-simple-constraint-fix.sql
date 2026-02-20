-- Alternativamente, usar una columna de tipo domain o enum sería mejor, pero esto debería funcionar
-- Primero, eliminamos el constraint antiguo
ALTER TABLE users DROP CONSTRAINT users_role_check;

-- Luego recreamos con supervisor incluido
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'supervisor', 'super_admin'));

-- Confirmar que el constraint se recreó
SELECT * FROM users LIMIT 1;
