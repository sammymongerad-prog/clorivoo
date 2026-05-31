-- ============================================================
-- CLORIVO — Full migration: categories + reassign CJ products
-- Run once in Supabase SQL editor
-- ============================================================

-- 1. Add missing columns to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active    BOOLEAN DEFAULT true;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color        TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS cj_category_id TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_created BOOLEAN DEFAULT false;

-- 2. Allow products without shop (CJ admin imports)
ALTER TABLE products ALTER COLUMN shop_id DROP NOT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_percent NUMERIC DEFAULT 30;

-- 3. Seed 7 main Clorivo categories
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

-- 4. Reassign existing CJ products to correct category_id
--    based on their `category` text field using keyword matching

-- Mode (clothing, fashion, accessories, scarves, bags, shoes, jewelry)
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'mode' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%cloth%' OR category ILIKE '%fashion%' OR category ILIKE '%dress%'
    OR category ILIKE '%shirt%' OR category ILIKE '%pants%' OR category ILIKE '%jacket%'
    OR category ILIKE '%scarf%' OR category ILIKE '%wrap%' OR category ILIKE '%skirt%'
    OR category ILIKE '%bag%' OR category ILIKE '%shoe%' OR category ILIKE '%boot%'
    OR category ILIKE '%jewel%' OR category ILIKE '%necklace%' OR category ILIKE '%ring%'
    OR category ILIKE '%watch%' OR category ILIKE '%accessori%' OR category ILIKE '%lingerie%'
    OR category ILIKE '%swim%' OR category ILIKE '%hat%' OR category ILIKE '%cap%'
    OR category ILIKE '%mode%' OR category ILIKE '%femme%' OR category ILIKE '%homme%'
    OR category ILIKE '%vêtement%' OR category ILIKE '%sunglasses%'
  );

-- Beauté
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'beaute' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%beauty%' OR category ILIKE '%makeup%' OR category ILIKE '%cosmetic%'
    OR category ILIKE '%skincare%' OR category ILIKE '%hair%' OR category ILIKE '%nail%'
    OR category ILIKE '%perfume%' OR category ILIKE '%fragrance%' OR category ILIKE '%serum%'
    OR category ILIKE '%cream%' OR category ILIKE '%shampoo%' OR category ILIKE '%beauté%'
    OR category ILIKE '%soin%' OR category ILIKE '%maquillage%' OR category ILIKE '%lip%'
  );

-- Tech
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'tech' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%phone%' OR category ILIKE '%smartphone%' OR category ILIKE '%tablet%'
    OR category ILIKE '%laptop%' OR category ILIKE '%audio%' OR category ILIKE '%earphone%'
    OR category ILIKE '%headphone%' OR category ILIKE '%gaming%' OR category ILIKE '%keyboard%'
    OR category ILIKE '%charger%' OR category ILIKE '%drone%' OR category ILIKE '%gadget%'
    OR category ILIKE '%electronic%' OR category ILIKE '%tech%' OR category ILIKE '%cable%'
    OR category ILIKE '%camera%'
  );

-- Électro
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'electro' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%appliance%' OR category ILIKE '%vacuum%' OR category ILIKE '%blender%'
    OR category ILIKE '%coffee%' OR category ILIKE '%air fryer%' OR category ILIKE '%toaster%'
    OR category ILIKE '%fan%' OR category ILIKE '%heater%' OR category ILIKE '%lamp%'
    OR category ILIKE '%led%' OR category ILIKE '%bulb%' OR category ILIKE '%électro%'
    OR category ILIKE '%electro%'
  );

-- Enfants
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'enfants' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%baby%' OR category ILIKE '%kid%' OR category ILIKE '%child%'
    OR category ILIKE '%toy%' OR category ILIKE '%doll%' OR category ILIKE '%puzzle%'
    OR category ILIKE '%stroller%' OR category ILIKE '%enfant%' OR category ILIKE '%bébé%'
    OR category ILIKE '%jouet%'
  );

-- Sport
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'sport' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%sport%' OR category ILIKE '%fitness%' OR category ILIKE '%gym%'
    OR category ILIKE '%yoga%' OR category ILIKE '%cycling%' OR category ILIKE '%bike%'
    OR category ILIKE '%running%' OR category ILIKE '%swim%' OR category ILIKE '%hiking%'
    OR category ILIKE '%camping%' OR category ILIKE '%fishing%' OR category ILIKE '%vélo%'
  );

-- Maison (everything else + explicit match)
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1)
WHERE (source = 'cj' OR source = 'manual')
  AND category_id IS NULL
  AND (
    category ILIKE '%home%' OR category ILIKE '%garden%' OR category ILIKE '%furniture%'
    OR category ILIKE '%decor%' OR category ILIKE '%bedding%' OR category ILIKE '%kitchen%'
    OR category ILIKE '%storage%' OR category ILIKE '%bathroom%' OR category ILIKE '%maison%'
    OR category ILIKE '%jardin%' OR category ILIKE '%cuisine%' OR category ILIKE '%déco%'
    OR category ILIKE '%textile%' OR category ILIKE '%rangement%' OR category ILIKE '%luminaire%'
  );

-- Fallback: any remaining products without category → Maison
UPDATE products SET category_id = (SELECT id FROM categories WHERE slug = 'maison' LIMIT 1)
WHERE category_id IS NULL AND status = 'active';

-- 5. Verify results
SELECT
  c.name AS category,
  COUNT(p.id) AS product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
WHERE c.parent_id IS NULL
GROUP BY c.name, c.position
ORDER BY c.position;
