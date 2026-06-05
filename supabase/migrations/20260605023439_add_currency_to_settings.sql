-- Add currency field to settings table
ALTER TABLE settings ADD COLUMN currency varchar(3) NOT NULL DEFAULT 'CRC';

-- Add check constraint for valid ISO 4217 codes
ALTER TABLE settings ADD CONSTRAINT valid_currency CHECK (currency ~ '^[A-Z]{3}$');
