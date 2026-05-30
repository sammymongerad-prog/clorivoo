-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Demo Seed Data
-- Run AFTER schema.sql. Creates demo categories, shops, products
-- and banners. Uses fixed UUIDs so re-runs are idempotent.
-- ═══════════════════════════════════════════════════════════════

-- ─── CATEGORIES ──────────────────────────────────────────────────
insert into public.categories (id, name, slug, icon, position) values
  ('c1000000-0000-0000-0000-000000000001', 'Maison & Déco',  'maison',   '🏠', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Mode & Style',   'mode',     '👗', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Tech & Gadgets', 'tech',     '📱', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Beauté & Soin',  'beaute',   '💄', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Sport & Loisirs','sport',    '⚽', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Enfants',        'enfants',  '🧸', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Cuisine',        'cuisine',  '🍳', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Électronique',   'electronique', '💻', 8)
on conflict (id) do nothing;

-- Sous-catégories Maison
insert into public.categories (id, name, slug, icon, parent_id, position) values
  ('c2000000-0000-0000-0000-000000000001', 'Décoration',  'deco',      '🖼️', 'c1000000-0000-0000-0000-000000000001', 1),
  ('c2000000-0000-0000-0000-000000000002', 'Luminaire',   'luminaire', '💡', 'c1000000-0000-0000-0000-000000000001', 2),
  ('c2000000-0000-0000-0000-000000000003', 'Textile',     'textile',   '🛏️', 'c1000000-0000-0000-0000-000000000001', 3),
  ('c2000000-0000-0000-0000-000000000004', 'Rangement',   'rangement', '📦', 'c1000000-0000-0000-0000-000000000001', 4)
on conflict (id) do nothing;

-- ─── HOMEPAGE BANNERS ────────────────────────────────────────────
insert into public.banners (id, title, subtitle, cta_text, bg_color, position, is_active) values
  ('b1000000-0000-0000-0000-000000000001',
   'Jusqu''à 70% offerts sur Maison & Cuisine',
   'Offre printemps — expire bientôt',
   'Acheter maintenant',
   '#6C4DFF', 1, true),
  ('b1000000-0000-0000-0000-000000000002',
   'Nouvelle collection Mode',
   'Les tendances printemps-été sont là',
   'Découvrir',
   '#059669', 2, true),
  ('b1000000-0000-0000-0000-000000000003',
   'Tech à petits prix',
   'Smartphones, tablettes, accessoires',
   'Explorer',
   '#D97706', 3, true),
  ('b1000000-0000-0000-0000-000000000004',
   'Beauté naturelle',
   'Cosmétiques clean & certifiés',
   'Voir les offres',
   '#DC2626', 4, true)
on conflict (id) do nothing;

-- ─── NOTE: Shops and products require real seller accounts. ──────
-- Run the following after creating seller accounts in Auth.
-- Replace the UUIDs with real seller profile IDs.
--
-- Example (uncomment and adapt):
--
-- insert into public.shops (id, seller_id, name, slug, description, is_verified, is_active)
-- values
--   ('s1000000-0000-0000-0000-000000000001',
--    '<your-seller-user-id>',
--    'luna.studio', 'luna-studio',
--    'Créations artisanales en céramique et terracotta.',
--    true, true);
--
-- insert into public.products (shop_id, category_id, title, price, compare_price, stock, status)
-- values
--   ('s1000000-0000-0000-0000-000000000001',
--    'c1000000-0000-0000-0000-000000000001',
--    'Vase Terracotta Nervuré', 24.50, 39.99, 100, 'active'),
--   ('s1000000-0000-0000-0000-000000000001',
--    'c1000000-0000-0000-0000-000000000001',
--    'Mug Céramique Artisanal', 14.99, 24.00, 50, 'active');
