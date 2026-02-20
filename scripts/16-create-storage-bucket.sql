-- ============================================
-- CREAR BUCKET DE STORAGE PARA RECIBOS
-- ============================================

-- Crear bucket para imagenes de recibos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Politica para permitir subir archivos (cualquiera puede subir)
DROP POLICY IF EXISTS "Anyone can upload receipts" ON storage.objects;
CREATE POLICY "Anyone can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts');

-- Politica para permitir ver archivos publicos
DROP POLICY IF EXISTS "Public read access for receipts" ON storage.objects;
CREATE POLICY "Public read access for receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Politica para permitir eliminar archivos (solo admins)
DROP POLICY IF EXISTS "Admins can delete receipts" ON storage.objects;
CREATE POLICY "Admins can delete receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts'
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Verificar que el bucket se creo
SELECT id, name, public, file_size_limit FROM storage.buckets WHERE id = 'receipts';
