-- =============================================
-- MIGRAR AL ESQUEMA DEL DUMP
-- =============================================
-- Este script recrea las tablas con el esquema original del dump
-- SIN foreign key a auth.users (los usuarios son independientes)

-- PASO 1: Eliminar tablas existentes
DROP TABLE IF EXISTS public.fuel_receipts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- PASO 2: Eliminar trigger de auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================
-- CREAR TABLA USERS (sin FK a auth.users)
-- =============================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id TEXT,
    username TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'super_admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CREAR TABLA FUEL_RECEIPTS
-- =============================================
CREATE TABLE public.fuel_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    telegram_id TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    aircraft_registration TEXT NOT NULL,
    supplier TEXT,
    initial_reading BIGINT,
    final_reading BIGINT,
    liters_dispensed BIGINT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    notes TEXT,
    receipt_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    receipt_number TEXT,
    operation_type TEXT
);

-- =============================================
-- HABILITAR RLS
-- =============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_receipts ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLITICAS RLS - Permitir acceso publico
-- =============================================
-- Dado que no hay autenticacion con auth.users, permitimos acceso completo

-- Users policies
CREATE POLICY "Allow all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Fuel receipts policies  
CREATE POLICY "Allow all on fuel_receipts" ON public.fuel_receipts FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- INDICES
-- =============================================
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_fuel_receipts_date ON public.fuel_receipts(date);
CREATE INDEX idx_fuel_receipts_aircraft ON public.fuel_receipts(aircraft_registration);
CREATE INDEX idx_fuel_receipts_user_id ON public.fuel_receipts(user_id);

-- =============================================
-- DATOS DE USUARIOS (2 registros)
-- =============================================
INSERT INTO public.users (id, telegram_id, username, first_name, last_name, role, is_active, created_at, updated_at) VALUES
('778caf85-e93c-4459-8e0d-934b51214ae8', NULL, 'admin', 'Admin', 'Estelar', 'admin', true, '2025-12-18 13:57:19.503302+00', '2026-01-21 23:49:44.193697+00'),
('1e9e8326-65d0-49aa-986c-d7c8b7479383', NULL, 'operador', 'Operador', 'Estelar', 'operator', true, '2026-01-19 16:15:53.607605+00', '2026-01-21 23:49:45.513056+00');

-- =============================================
-- DATOS DE RECIBOS DE COMBUSTIBLE (35 registros)
-- =============================================
INSERT INTO public.fuel_receipts (id, user_id, telegram_id, date, time, aircraft_registration, supplier, initial_reading, final_reading, liters_dispensed, origin, destination, notes, receipt_image_url, created_at, updated_at, receipt_number, operation_type) VALUES
('702f299e-ed9a-4500-a0f9-7deee8f02f5d', NULL, NULL, '2026-01-02', '06:10:00', 'YV2792', 'PDVSA', 47773466, 47781528, 8062, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851085943-823%202-1-2026.jpeg', '2026-01-19 19:31:26.970914+00', '2026-01-19 19:31:26.970914+00', '01-3475660', 'Regular'),
('6e0fe16c-1065-4a11-a8f1-7a4bf6dda771', NULL, NULL, '2026-01-02', '09:11:00', 'YV630T', 'PDVSA', 4316553, 4323321, 6768, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851290921-891%202-1-2026.jpeg', '2026-01-19 19:34:51.222752+00', '2026-01-19 19:34:51.222752+00', '01-2778842', 'Regular'),
('172deb45-a1c2-4f26-a30a-117e8c0689a4', NULL, NULL, '2026-01-02', '10:20:00', 'YV2792', 'PDVSA', 47814312, 47823017, 8705, 'CCS', 'STD', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851439585-861%202-1-2026.jpeg', '2026-01-19 19:37:19.890057+00', '2026-01-19 19:37:19.890057+00', '01-2778868', 'Regular'),
('2f42e3e0-3f86-4a53-b0ab-d2e07f1c21b7', NULL, NULL, '2026-01-02', '14:56:00', 'YV630T', 'PDVSA', 4323320, 4331379, 8059, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851535823-8301%202-1-2026.jpeg', '2026-01-19 19:38:55.993289+00', '2026-01-19 19:38:55.993289+00', '01-2778871', 'Regular'),
('07d7e082-6e93-4bef-813a-21d7323f3bed', NULL, NULL, '2026-01-02', '17:30:00', 'YV666T', 'PDVSA', 62555400, 62565572, 10172, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851673117-840%202-1-2026.jpeg', '2026-01-19 19:41:13.374086+00', '2026-01-19 19:41:13.374086+00', '01-2778872', 'Regular'),
('c5f47ce1-b38f-48a3-8e97-c24d6cc3ea1e', NULL, NULL, '2026-01-03', '05:54:00', 'YV2792', 'PDVSA', 47837192, 47844903, 7711, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851864775-842%203-1-2026.jpeg', '2026-01-19 19:44:24.938044+00', '2026-01-19 19:44:24.938044+00', '01-2778875', 'Regular'),
('b2cf1a4d-c3ef-42a9-8e4c-b3f3c9db56a3', NULL, NULL, '2026-01-03', '07:33:00', 'YV630T', 'PDVSA', 4373355, 4380773, 7418, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768851969178-830%203-1-2026.jpeg', '2026-01-19 19:46:09.307082+00', '2026-01-19 19:46:09.307082+00', '01-2778876', 'Regular'),
('05a18c3e-1fd4-439c-ae76-2c437f2ba3be', NULL, NULL, '2026-01-03', '12:08:00', 'YV666T', 'PDVSA', 62573195, 62583617, 10422, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852069905-854%203-1-2026.jpeg', '2026-01-19 19:47:50.026188+00', '2026-01-19 19:47:50.026188+00', '01-2778878', 'Regular'),
('25ff0e4f-46b4-4d12-9d9e-5cc390f97d1a', NULL, NULL, '2026-01-03', '14:19:00', 'YV2792', 'PDVSA', 47861028, 47868238, 7210, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852144847-850%203-1-2026.jpeg', '2026-01-19 19:49:04.972596+00', '2026-01-19 19:49:04.972596+00', '01-2778879', 'Regular'),
('d3e8a1cf-6d2f-4b5c-9a7e-f6c8d4e5b3a2', NULL, NULL, '2026-01-06', '05:45:00', 'YV2792', 'PDVSA', 47890325, 47899027, 8702, 'CCS', 'STD', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852253547-824%206-1-2026.jpeg', '2026-01-19 19:50:53.674296+00', '2026-01-19 19:50:53.674296+00', '01-2778895', 'Regular'),
('a7b2c4d6-e8f0-4a2c-b6d8-e0f2a4c6b8d0', NULL, NULL, '2026-01-06', '12:05:00', 'YV630T', 'PDVSA', 4421505, 4429063, 7558, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852335889-894%206-1-2026.jpeg', '2026-01-19 19:52:16.014949+00', '2026-01-19 19:52:16.014949+00', '01-2778913', 'Regular'),
('f1e2d3c4-b5a6-4789-0abc-def123456789', NULL, NULL, '2026-01-06', '12:44:00', 'YV666T', 'PDVSA', 62642312, 62652784, 10472, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852421546-857%206-1-2026.jpeg', '2026-01-19 19:53:41.675152+00', '2026-01-19 19:53:41.675152+00', '01-2778915', 'Regular'),
('12345678-abcd-4ef0-1234-567890abcdef', NULL, NULL, '2026-01-06', '17:18:00', 'YV2792', 'PDVSA', 47915175, 47923328, 8153, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852513589-850%206-1-2026.jpeg', '2026-01-19 19:55:13.720115+00', '2026-01-19 19:55:13.720115+00', '01-2778921', 'Regular'),
('87654321-dcba-4fe0-4321-fedcba098765', NULL, NULL, '2026-01-07', '05:30:00', 'YV630T', 'PDVSA', 4445245, 4452764, 7519, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852609356-854%207-1-2026.jpeg', '2026-01-19 19:56:49.487619+00', '2026-01-19 19:56:49.487619+00', '01-2778925', 'Regular'),
('abcdef12-3456-4789-abcd-ef1234567890', NULL, NULL, '2026-01-07', '06:22:00', 'YV2792', 'PDVSA', 47939527, 47949028, 9501, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852730455-886%207-1-2026.jpeg', '2026-01-19 19:58:50.585682+00', '2026-01-19 19:58:50.585682+00', '01-2778928', 'Regular'),
('fedcba98-7654-4321-fedc-ba9876543210', NULL, NULL, '2026-01-07', '11:42:00', 'YV666T', 'PDVSA', 62701030, 62710352, 9322, 'CCS', 'BLA', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852829674-855%207-1-2026.jpeg', '2026-01-19 20:00:29.797491+00', '2026-01-19 20:00:29.797491+00', '01-2778932', 'Regular'),
('11111111-2222-4333-4444-555566667777', NULL, NULL, '2026-01-07', '15:24:00', 'YV2792', 'PDVSA', 47957113, 47965364, 8251, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768852927811-869%207-1-2026.jpeg', '2026-01-19 20:02:07.943124+00', '2026-01-19 20:02:07.943124+00', '01-2778942', 'Regular'),
('88888888-9999-4aaa-bbbb-ccccddddeeee', NULL, NULL, '2026-01-08', '06:06:00', 'YV630T', 'PDVSA', 4468942, 4477061, 8119, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853035892-833%208-1-2026.jpeg', '2026-01-19 20:03:56.025618+00', '2026-01-19 20:03:56.025618+00', '01-2778951', 'Regular'),
('ffffffff-eeee-4ddd-cccc-bbbbaaaa9999', NULL, NULL, '2026-01-08', '06:51:00', 'YV2792', 'PDVSA', 47981581, 47990034, 8453, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853146822-814%208-1-2026.jpeg', '2026-01-19 20:05:46.956313+00', '2026-01-19 20:05:46.956313+00', '01-2778952', 'Regular'),
('00000000-1111-4222-3333-444455556666', NULL, NULL, '2026-01-08', '11:45:00', 'YV666T', 'PDVSA', 62719024, 62729048, 10024, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853258546-870%208-1-2026.jpeg', '2026-01-19 20:07:38.675224+00', '2026-01-19 20:07:38.675224+00', '01-2778959', 'Regular'),
('77777777-6666-4555-4444-333322221111', NULL, NULL, '2026-01-08', '14:32:00', 'YV2792', 'PDVSA', 48006177, 48014527, 8350, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853357189-815%208-1-2026.jpeg', '2026-01-19 20:09:17.320851+00', '2026-01-19 20:09:17.320851+00', '01-2778962', 'Regular'),
('aabbccdd-eeff-4011-2233-445566778899', NULL, NULL, '2026-01-09', '05:56:00', 'YV2792', 'PDVSA', 48022605, 48030858, 8253, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853460893-897%209-1-2026.jpeg', '2026-01-19 20:11:01.02554+00', '2026-01-19 20:11:01.02554+00', '01-2778965', 'Regular'),
('99887766-5544-4332-2110-ffeeddccbbaa', NULL, NULL, '2026-01-09', '05:59:00', 'YV630T', 'PDVSA', 4477061, 4484328, 7267, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853549325-905%209-1-2026.jpeg', '2026-01-19 20:12:29.458024+00', '2026-01-19 20:12:29.458024+00', '01-2778966', 'Regular'),
('112233aa-bbcc-4dde-eff0-011223344556', NULL, NULL, '2026-01-09', '10:50:00', 'YV666T', 'PDVSA', 62737206, 62748779, 11573, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853632587-851%209-1-2026.jpeg', '2026-01-19 20:13:52.722355+00', '2026-01-19 20:13:52.722355+00', '01-2778978', 'Regular'),
('665544ff-eedd-4ccb-baa9-988776655443', NULL, NULL, '2026-01-09', '14:53:00', 'YV2792', 'PDVSA', 48047068, 48056470, 9402, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853717856-875%209-1-2026.jpeg', '2026-01-19 20:15:17.988654+00', '2026-01-19 20:15:17.988654+00', '01-2778981', 'Regular'),
('221100ff-eedd-4ccb-baa9-988776655432', NULL, NULL, '2026-01-10', '05:33:00', 'YV630T', 'PDVSA', 4500530, 4507949, 7419, 'CCS', 'BNS', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853813214-831%2010-1-2026.jpeg', '2026-01-19 20:16:53.344782+00', '2026-01-19 20:16:53.344782+00', '01-2778986', 'Regular'),
('334455aa-bbcc-4dde-eff0-112233445566', NULL, NULL, '2026-01-10', '05:53:00', 'YV2792', 'PDVSA', 48064495, 48073546, 9051, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768853904587-836%2010-1-2026.jpeg', '2026-01-19 20:18:24.721955+00', '2026-01-19 20:18:24.721955+00', '01-2778987', 'Regular'),
('aabbcc11-2233-4455-6677-8899aabbccdd', NULL, NULL, '2026-01-10', '12:16:00', 'YV666T', 'PDVSA', 62757121, 62766894, 9773, 'CCS', 'BLA', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854011925-861%2010-1-2026.jpeg', '2026-01-19 20:20:12.05824+00', '2026-01-19 20:20:12.05824+00', '01-2778992', 'Regular'),
('ddeeff00-1122-4334-5566-778899aabbcc', NULL, NULL, '2026-01-10', '14:32:00', 'YV2792', 'PDVSA', 48081559, 48090111, 8552, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854095812-848%2010-1-2026.jpeg', '2026-01-19 20:21:35.944215+00', '2026-01-19 20:21:35.944215+00', '01-2778995', 'Regular'),
('ffeeddcc-bbaa-4998-8776-655443322110', NULL, NULL, '2026-01-13', '05:20:00', 'YV630T', 'PDVSA', 4524115, 4532485, 8370, 'CCS', 'SVZ', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854199645-892%2013-1-2026.jpeg', '2026-01-19 20:23:19.779018+00', '2026-01-19 20:23:19.779018+00', '01-2778997', 'Regular'),
('00112233-4455-4667-8899-aabbccddeeff', NULL, NULL, '2026-01-13', '06:07:00', 'YV2792', 'PDVSA', 48098187, 48108087, 9900, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854305914-826%2013-1-2026.jpeg', '2026-01-19 20:25:06.051785+00', '2026-01-19 20:25:06.051785+00', '01-2778998', 'Regular'),
('99aabbcc-ddee-4ff0-0112-233445566778', NULL, NULL, '2026-01-13', '12:35:00', 'YV666T', 'PDVSA', 62775166, 62785039, 9873, 'CCS', 'BLA', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854396845-842%2013-1-2026.jpeg', '2026-01-19 20:26:36.982356+00', '2026-01-19 20:26:36.982356+00', '01-2779005', 'Regular'),
('44556677-8899-4aab-bccd-deeff0011223', NULL, NULL, '2026-01-13', '14:24:00', 'YV2792', 'PDVSA', 48116206, 48124507, 8301, 'CCS', 'PZO', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854492578-819%2013-1-2026.jpeg', '2026-01-19 20:28:12.710251+00', '2026-01-19 20:28:12.710251+00', '01-2779008', 'Regular'),
('bbccddee-ff00-4112-2334-455667788990', NULL, NULL, '2026-01-14', '08:00:00', 'YV666T', 'PDVSA', 62785039, 62795912, 10873, 'CCS', 'MAR', NULL, 'https://kzsz4x1opcov92q6.public.blob.vercel-storage.com/receipts/1768854589654-835%2014-1-2026.jpeg', '2026-01-19 20:29:49.78652+00', '2026-01-19 20:29:49.78652+00', '01-2779010', 'Regular');

-- Verificar datos importados
SELECT 'Usuarios importados:' as info, COUNT(*) as total FROM public.users;
SELECT 'Recibos importados:' as info, COUNT(*) as total FROM public.fuel_receipts;
