-- Migration 003: Shipment request flow (awaiting_arrival status + carrier tracking)
-- Applied to project: rrjrnckyoqhevzoafnut (jjs imex)

-- 1. Add 'awaiting_arrival' to package_status enum (before 'received_usa')
ALTER TYPE package_status ADD VALUE IF NOT EXISTS 'awaiting_arrival' BEFORE 'received_usa';

-- 2. Add carrier tracking columns
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS carrier_name TEXT,
  ADD COLUMN IF NOT EXISTS carrier_tracking_number TEXT;

-- 3. Add request_number column (client-facing reference before real tracking)
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS request_number TEXT UNIQUE;

-- 4. Make tracking_number nullable (NULL while awaiting_arrival)
ALTER TABLE packages ALTER COLUMN tracking_number DROP NOT NULL;

-- 5. Add category and description columns for client-created shipments
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS weight_estimated NUMERIC,
  ADD COLUMN IF NOT EXISTS receiver_first_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_last_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_phone TEXT;

-- 6. Generate request number function
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TEXT AS $$
DECLARE
  current_year TEXT;
  next_val INT;
  req_number TEXT;
BEGIN
  current_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'JJI-REQ-' || current_year || '-(\d+)') AS INT)
  ), 0) + 1
  INTO next_val
  FROM packages
  WHERE request_number LIKE 'JJI-REQ-' || current_year || '-%';

  req_number := 'JJI-REQ-' || current_year || '-' || LPAD(next_val::TEXT, 5, '0');
  RETURN req_number;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger: auto-generate request_number on insert when status = awaiting_arrival
CREATE OR REPLACE FUNCTION trg_generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'awaiting_arrival' AND NEW.request_number IS NULL THEN
    NEW.request_number := generate_request_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_package_request_number ON packages;
CREATE TRIGGER trg_package_request_number
  BEFORE INSERT ON packages
  FOR EACH ROW
  EXECUTE FUNCTION trg_generate_request_number();

-- 8. Index for fast lookup by request_number and carrier_tracking_number
CREATE INDEX IF NOT EXISTS idx_packages_request_number ON packages (request_number) WHERE request_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packages_carrier_tracking ON packages (carrier_tracking_number) WHERE carrier_tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_packages_awaiting ON packages (status) WHERE status = 'awaiting_arrival';
