-- Script de diagnóstico completo para problemas de autenticación
-- Este script verifica todos los aspectos del sistema de autenticación

-- 1. Verificar que los usuarios supervisor existen en auth.users
SELECT 
  'AUTH.USERS CHECK' as check_type,
  email,
  id,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email IN ('samuel.gapo@flyestelar.com', 'leonardo.canas@flyestelar.com')
ORDER BY email;

-- 2. Verificar que los perfiles supervisor existen en users table
SELECT 
  'PUBLIC.USERS CHECK' as check_type,
  email,
  username,
  role,
  is_active,
  created_at
FROM users 
WHERE role = 'supervisor'
ORDER BY email;

-- 3. Verificar constraints de la tabla users
SELECT 
  'CONSTRAINTS CHECK' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
AND conname LIKE '%role%';

-- 4. Verificar RLS policies en la tabla users
SELECT 
  'RLS POLICIES CHECK' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';

-- 5. Verificar si RLS está habilitado en la tabla users
SELECT 
  'RLS STATUS CHECK' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'users';

-- 6. Intentar leer directamente como anon (simula el cliente)
SET ROLE anon;
SELECT 
  'ANON READ TEST' as check_type,
  email,
  role,
  is_active
FROM users
WHERE email = 'samuel.gapo@flyestelar.com';
RESET ROLE;
