-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Seed Data  (idempotent — safe to re-run)
-- Run AFTER schema.sql in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── CATEGORIES ──────────────────────────────────────────────────
insert into public.categories (id, name, slug, icon, position) values
  ('11111111-0000-0000-0000-000000000001', 'Maison',   'maison',   '🏠', 1),
  ('11111111-0000-0000-0000-000000000002', 'Mode',     'mode',     '👗', 2),
  ('11111111-0000-0000-0000-000000000003', 'Tech',     'tech',     '📱', 3),
  ('11111111-0000-0000-0000-000000000004', 'Beauté',   'beaute',   '💄', 4),
  ('11111111-0000-0000-0000-000000000005', 'Sport',    'sport',    '⚽', 5),
  ('11111111-0000-0000-0000-000000000006', 'Enfants',  'enfants',  '🧸', 6),
  ('11111111-0000-0000-0000-000000000007', 'Jardin',   'jardin',   '🌱', 7),
  ('11111111-0000-0000-0000-000000000008', 'Électro',  'electro',  '🔌', 8)
on conflict (slug) do nothing;

insert into public.categories (name, slug, icon, parent_id, position) values
  ('Déco',         'deco',         '🕯️',  '11111111-0000-0000-0000-000000000001', 10),
  ('Cuisine',      'cuisine',      '🍳',  '11111111-0000-0000-0000-000000000001', 11),
  ('Femme',        'mode-femme',   '👠',  '11111111-0000-0000-0000-000000000002', 20),
  ('Homme',        'mode-homme',   '👔',  '11111111-0000-0000-0000-000000000002', 21),
  ('Accessoires',  'accessoires',  '👜',  '11111111-0000-0000-0000-000000000002', 22),
  ('Smartphones',  'smartphones',  '📱',  '11111111-0000-0000-0000-000000000003', 30),
  ('Audio',        'audio',        '🎧',  '11111111-0000-0000-0000-000000000003', 31),
  ('Soin visage',  'soin-visage',  '✨',  '11111111-0000-0000-0000-000000000004', 40),
  ('Maquillage',   'maquillage',   '💋',  '11111111-0000-0000-0000-000000000004', 41)
on conflict (slug) do nothing;

-- ─── HOMEPAGE BANNERS ────────────────────────────────────────────
insert into public.banners (title, subtitle, cta_text, bg_color, position, is_active) values
  ('Jusqu''à 70% offerts sur Maison & Cuisine', 'Offre printemps — jusqu''au 15 juin', 'Acheter maintenant →', '#6C4DFF', 1, true),
  ('Nouvelle collection Mode Femme', 'Les tendances de la saison', 'Découvrir →', '#C97B5A', 2, true),
  ('Tech à prix cassés', 'Smartphones, audio, accessoires', 'Voir les offres →', '#3B82F6', 3, true)
on conflict do nothing;

-- ─── DEMO DATA FUNCTION ──────────────────────────────────────────
-- After signing up as your first user, run in SQL Editor:
--   select seed_demo_products(auth.uid());
-- This creates a demo shop + 18 products visible in the app.

create or replace function seed_demo_products(p_seller_id uuid)
returns text language plpgsql security definer as $$
declare
  v_shop_id uuid;
begin
  -- Update profile to seller role
  update public.profiles set role = 'seller' where id = p_seller_id;

  -- Create demo shop
  insert into public.shops (id, seller_id, name, slug, description, brand_color, is_verified, is_active, followers)
  values (
    '22222222-0000-0000-0000-000000000001'::uuid,
    p_seller_id, 'Luna Studio', 'luna-studio',
    'Créations artisanales pour la maison et la mode', '#6C4DFF', true, true, 2400
  )
  on conflict (id) do update set seller_id = p_seller_id
  returning id into v_shop_id;

  -- Maison products
  insert into public.products (shop_id, seller_id, category_id, category, title, description, price, compare_price, images, stock, rating, reviews_count, is_featured, status)
  select v_shop_id, p_seller_id, '11111111-0000-0000-0000-000000000001', 'maison',
    t.title, t.description, t.price, t.compare_price, array[t.image_url], t.stock, t.rating, t.reviews_count, t.is_featured, 'active'
  from (values
    ('Vase en céramique artisanal', 'Façonné à la main, émaillé au four. Hauteur 25 cm.', 42.00::numeric, 68.00::numeric, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80', 15, 4.8::numeric, 312, true),
    ('Bougie parfumée Vanille & Ambre', 'Cire naturelle de soja, 60h de combustion.', 24.90, null, 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&q=80', 50, 4.7, 189, false),
    ('Plateau en bois d''olivier', 'Bois massif, fait main, 35×20 cm.', 38.00, 55.00, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80', 20, 4.9, 87, true),
    ('Coussin lin naturel 45×45', '100% lin lavé, housse amovible, 3 coloris.', 29.90, null, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80', 40, 4.6, 156, false),
    ('Lampe de table en rotin', 'Structure rotin naturel, abat-jour coton.', 89.00, 129.00, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', 8, 4.8, 234, true)
  ) as t(title, description, price, compare_price, image_url, stock, rating, reviews_count, is_featured)
  on conflict do nothing;

  -- Mode products
  insert into public.products (shop_id, seller_id, category_id, category, title, description, price, compare_price, images, stock, rating, reviews_count, is_featured, status)
  select v_shop_id, p_seller_id, '11111111-0000-0000-0000-000000000002', 'mode',
    t.title, t.description, t.price, t.compare_price, array[t.image_url], t.stock, t.rating, t.reviews_count, t.is_featured, 'active'
  from (values
    ('Veste en cuir marron cognac', 'Cuir véritable, coupe ajustée, doublure soie.', 189.00::numeric, 280.00::numeric, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&q=80', 12, 4.9::numeric, 445, true),
    ('Robe lin midi fluide', '100% lin, taille élastiquée, poches latérales.', 79.90, 110.00, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80', 25, 4.7, 321, true),
    ('Sneakers blanches minimalistes', 'Cuir pleine fleur, semelle caoutchouc.', 135.00, null, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', 30, 4.8, 567, false),
    ('Sac cabas toile naturelle', 'Toile de coton bio, anses cuir, grand format.', 65.00, 89.00, 'https://images.unsplash.com/photo-1584917865442-de89be371fe7?w=400&q=80', 18, 4.6, 198, false),
    ('Pull laine mérinos col roulé', 'Laine mérinos extra-fine, 12 coloris.', 95.00, 140.00, 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&q=80', 35, 4.9, 289, true)
  ) as t(title, description, price, compare_price, image_url, stock, rating, reviews_count, is_featured)
  on conflict do nothing;

  -- Tech products
  insert into public.products (shop_id, seller_id, category_id, category, title, description, price, compare_price, images, stock, rating, reviews_count, is_featured, status)
  select v_shop_id, p_seller_id, '11111111-0000-0000-0000-000000000003', 'tech',
    t.title, t.description, t.price, t.compare_price, array[t.image_url], t.stock, t.rating, t.reviews_count, t.is_featured, 'active'
  from (values
    ('Écouteurs sans fil ANC Pro', 'Réduction de bruit active, 30h autonomie, Bluetooth 5.2.', 149.00::numeric, 229.00::numeric, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 25, 4.8::numeric, 892, true),
    ('Montre connectée Sport', 'GPS intégré, cardio, 7j autonomie, waterproof 50m.', 199.00, 279.00, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', 15, 4.7, 456, true),
    ('Powerbank 20 000 mAh', 'Charge rapide 65W, 2×USB-A + USB-C, poids 380g.', 59.90, 89.00, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80', 50, 4.6, 1203, false),
    ('Câble tressé USB-C 2m', 'Nylon renforcé, charge rapide 100W, USB-C vers USB-C.', 19.90, null, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80', 100, 4.5, 334, false)
  ) as t(title, description, price, compare_price, image_url, stock, rating, reviews_count, is_featured)
  on conflict do nothing;

  -- Beauté products
  insert into public.products (shop_id, seller_id, category_id, category, title, description, price, compare_price, images, stock, rating, reviews_count, is_featured, status)
  select v_shop_id, p_seller_id, '11111111-0000-0000-0000-000000000004', 'beaute',
    t.title, t.description, t.price, t.compare_price, array[t.image_url], t.stock, t.rating, t.reviews_count, t.is_featured, 'active'
  from (values
    ('Sérum Vitamine C 20%', 'Formule concentrée, anti-taches, éclat garanti.', 45.00::numeric, 65.00::numeric, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80', 40, 4.9::numeric, 678, true),
    ('Palette yeux nude & smoky', '18 teintes, longue tenue 24h, vegan.', 38.00, 55.00, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&q=80', 30, 4.7, 445, true),
    ('Crème visage hydratante SPF30', 'Texture légère, protection solaire, peaux mixtes.', 32.00, null, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80', 60, 4.8, 521, false),
    ('Huile sèche corps & cheveux', 'Mélange argan + jojoba, parfum rose.', 28.90, 42.00, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80', 45, 4.6, 289, false)
  ) as t(title, description, price, compare_price, image_url, stock, rating, reviews_count, is_featured)
  on conflict do nothing;

  return 'Demo data seeded successfully! Shop: Luna Studio, 18 products created.';
end;
$$;
