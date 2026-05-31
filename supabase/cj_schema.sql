-- CJ Dropshipping + Category management migration
-- Run once in Supabase SQL editor

-- 1. Allow products without a shop (CJ admin imports)
ALTER TABLE products ALTER COLUMN shop_id DROP NOT NULL;

-- 2. Product tracking columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_percent NUMERIC DEFAULT 30;

-- 3. Category enhancements
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color        TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS cj_category_id TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;

-- 4. Seed main Clorivo categories if they don't exist
INSERT INTO categories (name, slug, icon, color, position, is_active)
VALUES
  ('Maison',   'maison',  '🏠', '#C97B5A', 1, true),
  ('Tech',     'tech',    '📱', '#4A6FD4', 2, true),
  ('Beauté',   'beaute',  '💄', '#E67E22', 3, true),
  ('Mode',     'mode',    '👗', '#9B59B6', 4, true),
  ('Enfants',  'enfants', '🧸', '#F59E0B', 5, true),
  ('Sport',    'sport',   '⚽', '#10B981', 6, true),
  ('Électro',  'electro', '🔌', '#3B82F6', 7, true)
ON CONFLICT (slug) DO UPDATE SET
  color    = EXCLUDED.color,
  icon     = EXCLUDED.icon,
  is_active = COALESCE(categories.is_active, true);
