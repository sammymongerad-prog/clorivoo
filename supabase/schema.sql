-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Supabase Schema
-- Run this in your Supabase project → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── HELPER: auto-update updated_at ─────────────────────────────
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── PROFILES ────────────────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  phone       text,
  role        text not null default 'buyer' check (role in ('buyer','seller','admin')),
  shop_id     uuid,
  address     jsonb default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function handle_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── CATEGORIES ──────────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text unique not null,
  icon        text,
  parent_id   uuid references public.categories(id),
  position    int default 0,
  created_at  timestamptz default now()
);

-- ─── SHOPS ───────────────────────────────────────────────────────
create table public.shops (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  slug          text unique,
  description   text,
  logo_url      text,
  cover_url     text,
  brand_color   text default '#6C4DFF',
  promo_text    text,
  is_verified   boolean default false,
  is_active     boolean default true,
  followers     int default 0,
  rating        numeric(3,2) default 0,
  reviews_count int default 0,
  total_sales   int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger shops_updated_at before update on public.shops
  for each row execute function handle_updated_at();

-- ─── SHOP BANNERS ────────────────────────────────────────────────
create table public.shop_banners (
  id          uuid primary key default uuid_generate_v4(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  image_url   text,
  title       text,
  subtitle    text,
  cta_text    text,
  cta_url     text,
  position    int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

-- ─── PRODUCTS ────────────────────────────────────────────────────
create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  category_id   uuid references public.categories(id),
  title         text not null,
  description   text,
  price         numeric(10,2) not null,
  compare_price numeric(10,2),
  images        text[] default '{}',
  variants      jsonb default '[]',
  stock         int default 0,
  sku           text,
  status        text default 'active' check (status in ('active','draft','archived')),
  tags          text[] default '{}',
  sold_count    int default 0,
  rating        numeric(3,2) default 0,
  reviews_count int default 0,
  is_featured   boolean default false,
  source        text default 'manual' check (source in ('manual','cj')),
  cj_product_id text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger products_updated_at before update on public.products
  for each row execute function handle_updated_at();

create index products_shop_id_idx on public.products(shop_id);
create index products_category_id_idx on public.products(category_id);
create index products_status_idx on public.products(status);

-- ─── CARTS ───────────────────────────────────────────────────────
create table public.carts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id)
);

create trigger carts_updated_at before update on public.carts
  for each row execute function handle_updated_at();

create table public.cart_items (
  id          uuid primary key default uuid_generate_v4(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete cascade,
  variant     jsonb default '{}',
  quantity    int not null default 1 check (quantity > 0),
  price       numeric(10,2) not null,
  created_at  timestamptz default now(),
  unique(cart_id, product_id, variant)
);

-- ─── ORDERS ──────────────────────────────────────────────────────
create table public.orders (
  id               uuid primary key default uuid_generate_v4(),
  buyer_id         uuid not null references public.profiles(id),
  status           text not null default 'pending'
                     check (status in ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal         numeric(10,2) not null,
  discount         numeric(10,2) default 0,
  shipping_fee     numeric(10,2) default 0,
  total            numeric(10,2) not null,
  promo_code       text,
  shipping_address jsonb not null default '{}',
  shipping_method  text default 'standard',
  payment_method   text,
  payment_status   text default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  tracking_number  text,
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create trigger orders_updated_at before update on public.orders
  for each row execute function handle_updated_at();

create index orders_buyer_id_idx on public.orders(buyer_id);
create index orders_status_idx on public.orders(status);

create table public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id),
  shop_id     uuid references public.shops(id),
  title       text not null,
  image_url   text,
  variant     jsonb default '{}',
  quantity    int not null,
  price       numeric(10,2) not null,
  created_at  timestamptz default now()
);

-- ─── CONVERSATIONS & MESSAGES ─────────────────────────────────────
create table public.conversations (
  id             uuid primary key default uuid_generate_v4(),
  buyer_id       uuid not null references public.profiles(id),
  seller_id      uuid not null references public.profiles(id),
  shop_id        uuid references public.shops(id),
  product_id     uuid references public.products(id),
  last_message   text,
  last_message_at timestamptz default now(),
  buyer_unread   int default 0,
  seller_unread  int default 0,
  created_at     timestamptz default now(),
  unique(buyer_id, seller_id, product_id)
);

create index conversations_buyer_id_idx on public.conversations(buyer_id);
create index conversations_seller_id_idx on public.conversations(seller_id);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id),
  content         text not null,
  attachment_url  text,
  read_at         timestamptz,
  created_at      timestamptz default now()
);

create index messages_conversation_id_idx on public.messages(conversation_id);

-- Auto-update conversation on new message
create or replace function update_conversation_on_message()
returns trigger as $$
begin
  update public.conversations
  set last_message = new.content,
      last_message_at = new.created_at,
      buyer_unread = case
        when (select buyer_id from public.conversations where id = new.conversation_id) != new.sender_id
        then buyer_unread + 1 else buyer_unread end,
      seller_unread = case
        when (select seller_id from public.conversations where id = new.conversation_id) != new.sender_id
        then seller_unread + 1 else seller_unread end
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;

create trigger on_message_created
  after insert on public.messages
  for each row execute function update_conversation_on_message();

-- ─── NOTIFICATIONS ───────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  title       text not null,
  body        text,
  data        jsonb default '{}',
  read_at     timestamptz,
  created_at  timestamptz default now()
);

create index notifications_user_id_idx on public.notifications(user_id);

-- ─── KYC REQUESTS ────────────────────────────────────────────────
create table public.kyc_requests (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid not null references public.profiles(id) on delete cascade,
  shop_name     text,
  doc_front_url text,
  doc_back_url  text,
  selfie_url    text,
  status        text default 'pending' check (status in ('pending','approved','rejected')),
  review_notes  text,
  reviewed_by   uuid references public.profiles(id),
  reviewed_at   timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create trigger kyc_updated_at before update on public.kyc_requests
  for each row execute function handle_updated_at();

-- ─── BANNERS (Admin CMS) ──────────────────────────────────────────
create table public.banners (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  subtitle    text,
  image_url   text,
  cta_text    text,
  cta_url     text,
  bg_color    text default '#6C4DFF',
  position    int default 0,
  is_active   boolean default true,
  starts_at   timestamptz,
  ends_at     timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create trigger banners_updated_at before update on public.banners
  for each row execute function handle_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.shops enable row level security;
alter table public.shop_banners enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.kyc_requests enable row level security;
alter table public.banners enable row level security;

-- profiles
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- categories
create policy "Categories are public" on public.categories for select using (true);
create policy "Admins can manage categories" on public.categories for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- shops
create policy "Shops are publicly readable" on public.shops for select using (is_active = true);
create policy "Sellers can manage their shop" on public.shops for all
  using (seller_id = auth.uid());
create policy "Admins can manage all shops" on public.shops for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- shop_banners
create policy "Shop banners are public" on public.shop_banners for select using (is_active = true);
create policy "Sellers can manage their banners" on public.shop_banners for all
  using (shop_id in (select id from public.shops where seller_id = auth.uid()));

-- products
create policy "Active products are public" on public.products for select using (status = 'active');
create policy "Sellers can manage their products" on public.products for all
  using (shop_id in (select id from public.shops where seller_id = auth.uid()));
create policy "Admins can manage all products" on public.products for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- carts
create policy "Users can manage their cart" on public.carts for all
  using (user_id = auth.uid());
create policy "Users can manage their cart items" on public.cart_items for all
  using (cart_id in (select id from public.carts where user_id = auth.uid()));

-- orders
create policy "Buyers see their orders" on public.orders for select
  using (buyer_id = auth.uid());
create policy "Buyers can create orders" on public.orders for insert
  with check (buyer_id = auth.uid());
create policy "Sellers see orders for their shop" on public.order_items for select
  using (shop_id in (select id from public.shops where seller_id = auth.uid()));
create policy "Buyers see their order items" on public.order_items for select
  using (order_id in (select id from public.orders where buyer_id = auth.uid()));
create policy "Orders can be inserted with items" on public.order_items for insert
  with check (order_id in (select id from public.orders where buyer_id = auth.uid()));
create policy "Admins see all orders" on public.orders for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- conversations
create policy "Participants can see conversations" on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Users can create conversations" on public.conversations for insert
  with check (buyer_id = auth.uid());
create policy "Participants can update conversations" on public.conversations for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- messages
create policy "Participants can see messages" on public.messages for select
  using (conversation_id in (
    select id from public.conversations
    where buyer_id = auth.uid() or seller_id = auth.uid()
  ));
create policy "Participants can send messages" on public.messages for insert
  with check (
    sender_id = auth.uid() and
    conversation_id in (
      select id from public.conversations
      where buyer_id = auth.uid() or seller_id = auth.uid()
    )
  );

-- notifications
create policy "Users see their notifications" on public.notifications for select
  using (user_id = auth.uid());
create policy "Users can update their notifications" on public.notifications for update
  using (user_id = auth.uid());

-- kyc_requests
create policy "Sellers see their KYC" on public.kyc_requests for select
  using (seller_id = auth.uid());
create policy "Sellers can submit KYC" on public.kyc_requests for insert
  with check (seller_id = auth.uid());
create policy "Admins can manage all KYC" on public.kyc_requests for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- banners
create policy "Active banners are public" on public.banners for select
  using (is_active = true);
create policy "Admins manage banners" on public.banners for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ─── Storage buckets ──────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('shop-assets',    'shop-assets',    true),
  ('kyc-documents',  'kyc-documents',  false),
  ('avatars',        'avatars',        true)
on conflict do nothing;

create policy "Product images are public" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "Sellers can upload product images" on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Shop assets are public" on storage.objects for select
  using (bucket_id = 'shop-assets');
create policy "Sellers can upload shop assets" on storage.objects for insert
  with check (bucket_id = 'shop-assets' and auth.role() = 'authenticated');

create policy "KYC docs only by owner" on storage.objects for insert
  with check (bucket_id = 'kyc-documents' and auth.role() = 'authenticated');
create policy "KYC docs visible to owner and admins" on storage.objects for select
  using (bucket_id = 'kyc-documents' and auth.role() = 'authenticated');

create policy "Avatars are public" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "Users can upload avatar" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
