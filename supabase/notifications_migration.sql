-- ============================================================
-- Clorivo — Notifications system migration
-- Run once in Supabase SQL editor
-- ============================================================

-- 1. notification_templates table (for auto-triggered messages)
CREATE TABLE IF NOT EXISTS notification_templates (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       text NOT NULL UNIQUE,  -- 'order_confirmed', 'order_shipped', etc.
  title      text NOT NULL,
  body       text NOT NULL,
  active     boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Seed default templates
INSERT INTO notification_templates (type, title, body) VALUES
  ('order_confirmed',  '✅ Commande confirmée !',           'Votre commande #{{order_id}} a bien été reçue.'),
  ('order_shipped',    '📦 Votre commande est en route !',  'Votre colis sera livré dans 2-5 jours ouvrés.'),
  ('order_delivered',  '🎉 Colis livré !',                 'Votre commande est arrivée. Notez votre achat !'),
  ('new_order_seller', '🛍️ Nouvelle commande reçue !',     'Une commande vient d''être passée dans votre boutique.'),
  ('new_message',      '💬 Nouveau message',                '{{sender_name}} vous a envoyé un message.'),
  ('kyc_approved',     '✅ Boutique activée !',             'Votre vérification KYC a été approuvée. Vous pouvez vendre !'),
  ('kyc_rejected',     '❌ Vérification refusée',           'Votre dossier KYC a été rejeté. Consultez les détails.'),
  ('welcome',          '👋 Bienvenue sur Clorivo !',        'Découvrez des milliers de produits à prix réduit.')
ON CONFLICT (type) DO NOTHING;

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
CREATE POLICY "Public read templates" ON notification_templates FOR SELECT USING (true);
CREATE POLICY "Admin write templates" ON notification_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own preferences" ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- 4. Improve existing notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url  text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS image_url   text;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_push   boolean DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

-- 5. Index for fast unread count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, read_at)
  WHERE read_at IS NULL;
