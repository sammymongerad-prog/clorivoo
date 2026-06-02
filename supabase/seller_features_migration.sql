-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Seller features migration
-- Run in Supabase SQL Editor AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── COUPONS ─────────────────────────────────────────────────────
create table if not exists public.coupons (
  id              uuid primary key default gen_random_uuid(),
  shop_id         uuid references public.shops(id) on delete cascade,
  code            text not null,
  discount_type   text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value  numeric not null default 0,
  min_order_amount numeric,
  usage_limit     integer,
  usage_count     integer not null default 0,
  expires_at      timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);
create unique index if not exists coupons_shop_code_idx on public.coupons(shop_id, code);
alter table public.coupons enable row level security;
do $$ begin
  create policy "Seller manages own coupons" on public.coupons
    using (shop_id in (select id from public.shops where seller_id = auth.uid()))
    with check (shop_id in (select id from public.shops where seller_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public can read active coupons" on public.coupons for select
    using (is_active = true);
exception when duplicate_object then null; end $$;

-- ─── SELLER DISCOUNTS ────────────────────────────────────────────
create table if not exists public.seller_discounts (
  id               uuid primary key default gen_random_uuid(),
  seller_id        uuid not null references auth.users(id) on delete cascade,
  category_id      uuid references public.categories(id) on delete cascade,
  discount_percent numeric not null default 0 check (discount_percent between 0 and 100),
  is_active        boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (seller_id, category_id)
);
alter table public.seller_discounts enable row level security;
do $$ begin
  create policy "Seller manages own discounts" on public.seller_discounts
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── SELLER NOTES ────────────────────────────────────────────────
create table if not exists public.seller_notes (
  id          uuid primary key default gen_random_uuid(),
  seller_id   uuid not null references auth.users(id) on delete cascade,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now()
);
alter table public.seller_notes enable row level security;
do $$ begin
  create policy "Seller manages own notes" on public.seller_notes
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── WITHDRAWAL REQUESTS ─────────────────────────────────────────
create table if not exists public.withdrawal_requests (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references auth.users(id) on delete cascade,
  amount          numeric not null,
  method          text not null,
  account_details text not null,
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz not null default now()
);
alter table public.withdrawal_requests enable row level security;
do $$ begin
  create policy "Seller manages own withdrawals" on public.withdrawal_requests
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── SUPPORT TICKETS ─────────────────────────────────────────────
create table if not exists public.support_tickets (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references auth.users(id) on delete cascade,
  subject    text not null,
  message    text not null,
  priority   text not null default 'medium' check (priority in ('low','medium','high')),
  status     text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  response   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.support_tickets enable row level security;
do $$ begin
  create policy "Seller manages own tickets" on public.support_tickets
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── PRODUCT QUERIES ─────────────────────────────────────────────
create table if not exists public.product_queries (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid references public.products(id) on delete cascade,
  seller_id       uuid references auth.users(id) on delete cascade,
  customer_id     uuid references auth.users(id) on delete set null,
  customer_name   text,
  question        text not null,
  answer          text,
  status          text not null default 'pending' check (status in ('pending','answered')),
  created_at      timestamptz not null default now()
);
alter table public.product_queries enable row level security;
do $$ begin
  create policy "Seller reads and answers own queries" on public.product_queries
    using (seller_id = auth.uid())
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Customer submits query" on public.product_queries for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public reads answered queries" on public.product_queries for select
    using (status = 'answered' or seller_id = auth.uid() or customer_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ─── REVIEWS ─────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references public.products(id) on delete cascade,
  seller_id   uuid references auth.users(id) on delete cascade,
  buyer_id    uuid references auth.users(id) on delete set null,
  buyer_name  text,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
alter table public.reviews enable row level security;
do $$ begin
  create policy "Public reads reviews" on public.reviews for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Buyer submits review" on public.reviews for insert
    with check (auth.uid() is not null);
exception when duplicate_object then null; end $$;

-- ─── Storage bucket for seller files ─────────────────────────────
insert into storage.buckets (id, name, public) values ('seller-files', 'seller-files', false)
on conflict (id) do nothing;

do $$ begin
  create policy "Seller manages own files" on storage.objects
    for all using (bucket_id = 'seller-files' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'seller-files' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
