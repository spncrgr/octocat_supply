-- Migration 003: Add delivery vehicles table

CREATE TABLE delivery_vehicles (
    delivery_vehicle_id INTEGER PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    plate_number TEXT NOT NULL,
    vehicle_type TEXT,
    capacity_kg REAL,
    status TEXT NOT NULL DEFAULT 'active',
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE
);

CREATE INDEX idx_delivery_vehicles_branch_id ON delivery_vehicles(branch_id);
CREATE UNIQUE INDEX idx_delivery_vehicles_plate_number ON delivery_vehicles(plate_number);