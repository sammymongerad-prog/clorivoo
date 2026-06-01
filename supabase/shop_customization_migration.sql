-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Shop customization columns
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

alter table public.shops add column if not exists ticker_text text;
alter table public.shops add column if not exists ticker_active boolean default false;
alter table public.shops add column if not exists featured_category_ids uuid[] default '{}';
alter table public.shops add column if not exists featured_product_ids uuid[] default '{}';

-- Storage buckets for shop assets
insert into storage.buckets (id, name, public) values ('shops', 'shops', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('shop-banners', 'shop-banners', true) on conflict (id) do nothing;

-- Public read on shop assets
do $$ begin
  create policy "Public reads shop assets" on storage.objects for select
    using (bucket_id in ('shops', 'shop-banners'));
exception when duplicate_object then null; end $$;

-- Sellers can upload their own shop/banner images
do $$ begin
  create policy "Seller uploads shop assets" on storage.objects for insert
    with check (bucket_id in ('shops', 'shop-banners') and auth.uid() is not null);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Seller updates shop assets" on storage.objects for update
    using (bucket_id in ('shops', 'shop-banners') and auth.uid() is not null);
exception when duplicate_object then null; end $$;
