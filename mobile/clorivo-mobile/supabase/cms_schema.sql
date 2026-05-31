-- App config (key/value store)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'null',
  category TEXT DEFAULT 'general',
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_config" ON app_config FOR SELECT USING (true);
CREATE POLICY "admin_write_config" ON app_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert default config values
INSERT INTO app_config (key, value, category, label) VALUES
  ('app.name',              '"Clorivo"',       'app',   'Nom de l''application'),
  ('app.tagline',           '"shop · sell · ship"', 'app', 'Slogan'),
  ('app.logo_emoji',        '"c"',             'app',   'Logo emoji'),
  ('theme.primary',         '"#6C4DFF"',       'theme', 'Couleur principale'),
  ('theme.primary_soft',    '"#F1ECFF"',       'theme', 'Couleur principale douce'),
  ('theme.ink',             '"#0E0B1F"',       'theme', 'Couleur texte'),
  ('theme.paper',           '"#FBFAFC"',       'theme', 'Couleur fond'),
  ('theme.success',         '"#1F8A5B"',       'theme', 'Couleur succès'),
  ('theme.danger',          '"#D14343"',       'theme', 'Couleur danger'),
  ('features.google_oauth', 'true',            'features', 'Connexion Google'),
  ('features.seller_registration', 'true',     'features', 'Inscription vendeurs'),
  ('features.reviews',      'true',            'features', 'Avis produits'),
  ('features.videos',       'true',            'features', 'Vidéos produits'),
  ('features.referral',     'true',            'features', 'Parrainage'),
  ('shipping.free_threshold', '30',            'shipping', 'Commande min livraison gratuite ($)'),
  ('checkout.payment_methods', '["card","mobile_money","cash_on_delivery"]', 'checkout', 'Méthodes de paiement actives')
ON CONFLICT (key) DO NOTHING;

-- Homepage sections
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  visible BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_sections" ON homepage_sections FOR SELECT USING (true);
CREATE POLICY "admin_write_sections" ON homepage_sections FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO homepage_sections (key, label, visible, sort_order) VALUES
  ('hero_banners',      'Bannières hero',         true,  1),
  ('shortcuts',         'Raccourcis',             true,  2),
  ('flash_sale',        'Vente flash',            true,  3),
  ('categories',        'Catégories',             true,  4),
  ('featured_products', 'Produits vedette',       true,  5),
  ('shops',             'Boutiques',              true,  6),
  ('videos',            'Vidéos produits',        true,  7),
  ('all_products',      'Tous les produits',      true,  8)
ON CONFLICT (key) DO NOTHING;

-- Onboarding slides
CREATE TABLE IF NOT EXISTS onboarding_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  emoji TEXT DEFAULT '✨',
  bg_color TEXT DEFAULT '#6C4DFF',
  label TEXT,
  sort_order INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE onboarding_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_onboarding" ON onboarding_slides FOR SELECT USING (true);
CREATE POLICY "admin_write_onboarding" ON onboarding_slides FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO onboarding_slides (title, subtitle, emoji, bg_color, label, sort_order) VALUES
  ('Bienvenue sur Clorivo', 'Des millions de produits, des vendeurs vérifiés, des prix justes — tout au même endroit.', '🛍️', '#6C4DFF', 'lifestyle · shopping', 1),
  ('Des offres toute la journée', 'Ventes flash renouvelées chaque heure. Jusqu''à -80% sur les meilleures sélections.', '⚡', '#D97706', 'lifestyle · découverte', 2),
  ('Achetez en confiance', 'Vendeurs certifiés, paiements 3D-secure, retours gratuits sous 30 jours.', '🔒', '#059669', 'lifestyle · confiance', 3)
ON CONFLICT DO NOTHING;

-- Shipping methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  free_threshold NUMERIC DEFAULT NULL,
  estimated_days TEXT,
  emoji TEXT DEFAULT '🚚',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_shipping" ON shipping_methods FOR SELECT USING (true);
CREATE POLICY "admin_write_shipping" ON shipping_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO shipping_methods (key, name, description, price, free_threshold, estimated_days, emoji, sort_order) VALUES
  ('standard', 'Standard', 'Livraison en 5 à 8 jours', 3.99, 30, '5 à 8 jours', '🚚', 1),
  ('express',  'Express',  'Livraison en 2 à 3 jours', 8.99, NULL, '2 à 3 jours', '⚡', 2)
ON CONFLICT (key) DO NOTHING;

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT DEFAULT '💳',
  active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_payment" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "admin_write_payment" ON payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO payment_methods (key, name, description, emoji, sort_order) VALUES
  ('card',              'Carte bancaire',     'Visa, Mastercard, CB', '💳', 1),
  ('mobile_money',      'Mobile Money',       'Orange Money, MTN, Wave', '📱', 2),
  ('cash_on_delivery',  'Paiement à la livraison', 'Payez à la réception', '💵', 3)
ON CONFLICT (key) DO NOTHING;

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_notif_templates" ON notification_templates FOR SELECT USING (true);
CREATE POLICY "admin_write_notif_templates" ON notification_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

INSERT INTO notification_templates (key, title, body) VALUES
  ('order_confirmed',   'Commande confirmée ! 🎉',     'Votre commande #{{order_id}} a bien été reçue.'),
  ('order_shipped',     'Votre colis est en route 🚚',  'Votre commande #{{order_id}} a été expédiée.'),
  ('order_delivered',   'Livraison effectuée ✅',       'Votre commande #{{order_id}} a été livrée.'),
  ('new_message',       'Nouveau message 💬',           '{{sender}} vous a envoyé un message.'),
  ('flash_sale',        '⚡ Vente flash démarrée !',     'De nouvelles offres flash sont disponibles pendant 1h.')
ON CONFLICT (key) DO NOTHING;
