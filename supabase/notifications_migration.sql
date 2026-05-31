-- ============================================================
-- Clorivo — Notifications system migration
-- Run once in Supabase SQL editor
-- ============================================================

-- 1. notification_templates table
--    Uses "key" as the unique identifier (table may already exist with this column)
CREATE TABLE IF NOT EXISTS notification_templates (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        text NOT NULL UNIQUE,  -- 'order_confirmed', 'order_shipped', etc.
  title      text NOT NULL,
  body       text NOT NULL,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure key column exists if table was created with a different schema
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS key    text;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS title  text;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS body   text;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS notification_templates_key_key ON notification_templates(key);

-- 2. Seed default templates
INSERT INTO notification_templates (key, title, body) VALUES
  ('order_confirmed',  '✅ Commande confirmée !',           'Votre commande a bien été reçue.'),
  ('order_shipped',    '📦 Votre commande est en route !',  'Votre colis sera livré dans 2-5 jours ouvrés.'),
  ('order_delivered',  '🎉 Colis livré !',                 'Votre commande est arrivée. Notez votre achat !'),
  ('new_order_seller', '🛍️ Nouvelle commande reçue !',     'Une commande vient d''être passée dans votre boutique.'),
  ('new_message',      '💬 Nouveau message',                'Vous avez reçu un nouveau message.'),
  ('kyc_approved',     '✅ Boutique activée !',             'Votre vérification KYC a été approuvée. Vous pouvez vendre !'),
  ('kyc_rejected',     '❌ Vérification refusée',           'Votre dossier KYC a été rejeté. Consultez les détails.'),
  ('welcome',          '👋 Bienvenue sur Clorivo !',        'Découvrez des milliers de produits à prix réduit.')
ON CONFLICT (key) DO NOTHING;

-- 3. Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       text NOT NULL,  -- 'orders', 'messages', 'marketing', 'flash_sales', 'price_drops'
  push       boolean DEFAULT true,
  in_app     boolean DEFAULT true,
  email      boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type)
);

-- RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public read templates" ON notification_templates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Admin write templates" ON notification_templates FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Own preferences" ON notification_preferences FOR ALL
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Improve existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url   text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image_url    text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_push    boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

-- 5. Index for fast unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE read_at IS NULL;
