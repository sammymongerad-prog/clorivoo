-- ═══════════════════════════════════════════════════════════════
-- CLORIVO — Categories fix migration
-- Adds missing columns used by admin console
-- Run in Supabase SQL Editor AFTER schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Add image_url to categories (used by admin uploadCategoryImage)
alter table public.categories
  add column if not exists image_url text;

-- Add is_active to categories (used by admin toggleCategoryActive)
alter table public.categories
  add column if not exists is_active boolean not null default true;
