-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Shop customization columns
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

alter table public.shops add column if not exists ticker_text text;
alter table public.shops add column if not exists ticker_active boolean default false;
alter table public.shops add column if not exists featured_category_ids uuid[] default '{}';
alter table public.shops add column if not exists featured_product_ids uuid[] default '{}';
