-- Note: First create auth users through the signup page
-- This script provides examples of how to update roles and insert test data

-- Example: After creating auth users through signup, you can update their roles
-- Replace the emails with actual user emails

-- UPDATE public.users 
-- SET role = 'super_admin' 
-- WHERE email = 'admin@example.com';

-- UPDATE public.users 
-- SET role = 'admin' 
-- WHERE email = 'manager@example.com';

-- Sample fuel receipts with aircraft data
-- Replace user_id with actual UUIDs from auth.users after signing up

-- To get user IDs after signup:
-- SELECT id, email FROM auth.users;

-- Example insert statements (uncomment and replace UUIDs):
/*
INSERT INTO public.fuel_receipts (
  user_id, 
  telegram_id,
  date, 
  time, 
  aircraft_registration,
  supplier,
  initial_reading,
  final_reading,
  liters_dispensed,
  origin,
  destination,
  notes
)
VALUES 
  (
    'YOUR-USER-UUID-HERE', 
    555555555, 
    '2025-01-15', 
    '08:30:00', 
    'YV666T',
    'PDVSA',
    12345678,
    12345679,
    1234.50,
    'CCS',
    'MAR',
    'Vuelo regular matutino'
  ),
  (
    'YOUR-USER-UUID-HERE', 
    555555555, 
    '2025-01-16', 
    '14:20:00', 
    'YV657T',
    'Commerchamp',
    98765432,
    98765433,
    2100.00,
    'BNS',
    'CCS',
    'Retorno de vuelo charter'
  ),
  (
    'YOUR-USER-UUID-HERE', 
    666666666, 
    '2025-01-17', 
    '09:15:00', 
    'YV2792',
    'PDVSA',
    55555555,
    55555556,
    1850.75,
    'MAD',
    'PTY',
    'Vuelo internacional'
  ),
  (
    'YOUR-USER-UUID-HERE', 
    666666666, 
    '2025-01-18', 
    '16:45:00', 
    'YV630T',
    NULL,
    77777777,
    77777778,
    1500.00,
    'PZO',
    'SVZ',
    'Vuelo doméstico'
  );
*/

-- Instructions:
-- 1. Sign up users through the app at /signup
-- 2. Check their UUIDs: SELECT id, email, raw_user_meta_data->>'first_name' as name FROM auth.users;
-- 3. Update user roles if needed
-- 4. Replace 'YOUR-USER-UUID-HERE' with actual UUIDs
-- 5. Uncomment and run the INSERT statements
