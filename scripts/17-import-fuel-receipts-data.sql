-- =============================================
-- IMPORTAR DATOS DE RECIBOS DE COMBUSTIBLE
-- Fecha: 2026-01-21
-- =============================================
-- Este script importa los 35 recibos del dump anterior
-- Los user_id se dejan NULL ya que los usuarios originales
-- no existen en auth.users (esquema diferente)

-- Limpiar recibos existentes (opcional - comentar si quieres mantenerlos)
-- TRUNCATE TABLE fuel_receipts;

-- Insertar los 35 recibos de combustible
-- Este script ya no es necesario porque los datos se importaron en script 18
-- El esquema actual usa: liters_dispensed, receipt_image_url (no liters, image_url)

SELECT 'Los datos ya fueron importados en script 18-migrate-to-dump-schema.sql' as mensaje;
SELECT COUNT(*) as total_receipts FROM fuel_receipts;

-- Nota: Solo incluí 4 recibos como ejemplo
-- El dump completo tiene 35 recibos

-- Verificar importación
SELECT COUNT(*) as total_receipts FROM fuel_receipts;
SELECT id, date, aircraft_registration, origin, destination, receipt_number 
FROM fuel_receipts 
ORDER BY date DESC 
LIMIT 10;
