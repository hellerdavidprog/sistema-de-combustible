-- Insert sample super admin user
INSERT INTO users (telegram_id, username, first_name, last_name, role, is_active)
VALUES 
  (123456789, 'admin', 'Super', 'Admin', 'super_admin', true),
  (987654321, 'manager', 'Fleet', 'Manager', 'admin', true),
  (555555555, 'driver1', 'John', 'Doe', 'user', true),
  (666666666, 'driver2', 'Jane', 'Smith', 'user', true);

-- Insert sample fuel receipts
INSERT INTO fuel_receipts (
  user_id, 
  telegram_id,
  date, 
  time, 
  station_name, 
  fuel_type, 
  quantity, 
  unit_price, 
  total_amount,
  odometer_reading,
  vehicle_plate,
  location,
  notes
)
VALUES 
  (3, 555555555, '2025-01-10', '08:30:00', 'Shell Station', 'Diesel', 45.50, 1.25, 56.88, 125000, 'ABC-123', 'Main Street Station', 'Regular fill-up'),
  (3, 555555555, '2025-01-15', '14:20:00', 'BP Station', 'Diesel', 50.00, 1.30, 65.00, 125450, 'ABC-123', 'Highway 101', 'Full tank'),
  (4, 666666666, '2025-01-12', '09:15:00', 'Exxon', 'Gasoline', 40.00, 1.20, 48.00, 89000, 'XYZ-789', 'Downtown', 'Morning fill'),
  (4, 666666666, '2025-01-16', '16:45:00', 'Chevron', 'Gasoline', 38.50, 1.22, 46.97, 89350, 'XYZ-789', 'Airport Road', 'Evening fill');
