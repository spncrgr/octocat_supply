-- Seed data for delivery vehicles
INSERT INTO delivery_vehicles (delivery_vehicle_id, branch_id, name, plate_number, vehicle_type, capacity_kg, status) VALUES
(1, 1, 'Downtown Cargo Van', 'CAT-001', 'van', 1200, 'active'),
(2, 1, 'Whisker Express Truck', 'CAT-002', 'truck', 2800, 'active'),
(3, 2, 'Terrace Rapid Van', 'CAT-003', 'van', 1000, 'maintenance'),
(4, 2, 'Tabby Night Shuttle', 'CAT-004', 'mini-truck', 750, 'active');