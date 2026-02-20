-- Add receipt_number and operation_type columns to fuel_receipts table
ALTER TABLE fuel_receipts
ADD COLUMN IF NOT EXISTS receipt_number TEXT,
ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'regular' CHECK (operation_type IN ('regular', 'charter'));

-- Add index for faster queries on receipt_number
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_receipt_number ON fuel_receipts(receipt_number);

-- Add index for operation_type
CREATE INDEX IF NOT EXISTS idx_fuel_receipts_operation_type ON fuel_receipts(operation_type);
