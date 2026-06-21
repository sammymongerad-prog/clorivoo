-- Migration 004: Pickup requests table
-- Applied to project: rrjrnckyoqhevzoafnut (jjs imex)

-- 1. Create pickup_status enum
DO $$ BEGIN
  CREATE TYPE pickup_status AS ENUM ('pending', 'confirmed', 'collected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create pickup_requests table
CREATE TABLE IF NOT EXISTS pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_address TEXT NOT NULL,
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,
  estimated_weight DECIMAL,
  notes TEXT,
  status pickup_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_pickup_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_pickup_requests_updated_at ON pickup_requests;
CREATE TRIGGER trg_pickup_requests_updated_at
  BEFORE UPDATE ON pickup_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_pickup_requests_updated_at();

-- 4. Enable RLS
ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

-- 5. Client: INSERT and SELECT own requests
CREATE POLICY pickup_client_insert ON pickup_requests
  FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY pickup_client_select ON pickup_requests
  FOR SELECT TO authenticated
  USING (client_id = auth.uid());

-- 6. Admin/Super Admin/Employee: SELECT and UPDATE all
CREATE POLICY pickup_admin_select ON pickup_requests
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'employee')
    )
  );

CREATE POLICY pickup_admin_update ON pickup_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'employee')
    )
  );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_pickup_client ON pickup_requests (client_id);
CREATE INDEX IF NOT EXISTS idx_pickup_status ON pickup_requests (status);
CREATE INDEX IF NOT EXISTS idx_pickup_date ON pickup_requests (pickup_date);
