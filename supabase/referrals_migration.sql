-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Referrals migration
-- Run in Supabase SQL Editor AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════

-- ─── REFERRALS ────────────────────────────────────────────────────
create table if not exists public.referrals (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null references auth.users(id) on delete cascade,
  referred_id   uuid references auth.users(id) on delete set null,
  code          text not null,
  status        text not null default 'pending' check (status in ('pending', 'converted', 'cancelled')),
  commission    numeric not null default 0,
  order_id      uuid references public.orders(id) on delete set null,
  created_at    timestamptz not null default now(),
  converted_at  timestamptz
);

create index if not exists referrals_referrer_idx on public.referrals(referrer_id);
create index if not exists referrals_code_idx      on public.referrals(code);

alter table public.referrals enable row level security;

do $$ begin
  create policy "User sees own referrals" on public.referrals
    for select using (referrer_id = auth.uid() or referred_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "User creates referrals" on public.referrals
    for insert with check (referrer_id = auth.uid());
exception when duplicate_object then null; end $$;
