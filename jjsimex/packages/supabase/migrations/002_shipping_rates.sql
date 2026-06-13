-- Migration 002 : Tables shipping_rates et exchange_rates
-- Ajoute les colonnes manquantes et peuple les données initiales

-- ─── shipping_rates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shipping_rates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country TEXT NOT NULL CHECK (destination_country IN ('haiti', 'dominican_republic')),
  destination_city TEXT NOT NULL,
  air_rate         NUMERIC(6,2) NOT NULL DEFAULT 9.5,
  sea_rate         NUMERIC(6,2) NOT NULL DEFAULT 4.5,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_by       UUID REFERENCES users(id),
  UNIQUE (destination_country, destination_city)
);

-- Colonne updated_by si pas encore présente
ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);
ALTER TABLE shipping_rates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Données initiales : Haïti
INSERT INTO shipping_rates (destination_country, destination_city, air_rate, sea_rate) VALUES
  ('haiti', 'Port-au-Prince', 9.5,  4.5),
  ('haiti', 'Cap-Haïtien',    9.5,  4.5),
  ('haiti', 'Pétion-Ville',   9.5,  4.5),
  ('haiti', 'Les Cayes',      9.5,  4.5),
  ('haiti', 'Gonaïves',       9.5,  4.5),
  ('haiti', 'Jacmel',         9.5,  4.5),
  ('haiti', 'Saint-Marc',     9.5,  4.5),
  ('haiti', 'Miragoâne',      9.5,  4.5),
  -- Rép. Dominicaine
  ('dominican_republic', 'Santo Domingo', 11.0, 5.5),
  ('dominican_republic', 'Santiago',      11.0, 5.5),
  ('dominican_republic', 'Punta Cana',    11.0, 5.5),
  ('dominican_republic', 'La Romana',     11.0, 5.5),
  ('dominican_republic', 'San Pedro',     11.0, 5.5)
ON CONFLICT (destination_country, destination_city) DO NOTHING;

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_shipping_rates_updated_at ON shipping_rates;
CREATE TRIGGER trg_shipping_rates_updated_at
  BEFORE UPDATE ON shipping_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── exchange_rates ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exchange_rates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usd_to_htg  NUMERIC(10,2) NOT NULL DEFAULT 132.0,
  usd_to_dop  NUMERIC(10,2) NOT NULL DEFAULT 60.5,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id)
);

ALTER TABLE exchange_rates ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Données initiales
INSERT INTO exchange_rates (usd_to_htg, usd_to_dop)
SELECT 132.0, 60.5
WHERE NOT EXISTS (SELECT 1 FROM exchange_rates);

DROP TRIGGER IF EXISTS trg_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER trg_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Lecture publique des tarifs
DROP POLICY IF EXISTS "shipping_rates_read_all" ON shipping_rates;
CREATE POLICY "shipping_rates_read_all" ON shipping_rates
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "exchange_rates_read_all" ON exchange_rates;
CREATE POLICY "exchange_rates_read_all" ON exchange_rates
  FOR SELECT USING (TRUE);

-- Écriture admin/super_admin seulement
DROP POLICY IF EXISTS "shipping_rates_write_admin" ON shipping_rates;
CREATE POLICY "shipping_rates_write_admin" ON shipping_rates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "exchange_rates_write_admin" ON exchange_rates;
CREATE POLICY "exchange_rates_write_admin" ON exchange_rates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Realtime pour exchange_rates
ALTER PUBLICATION supabase_realtime ADD TABLE exchange_rates;
