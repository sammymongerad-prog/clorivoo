-- CJ Dropshipping migration — run once in Supabase SQL editor

-- Allow products without a shop (CJ admin imports)
ALTER TABLE products ALTER COLUMN shop_id DROP NOT NULL;

-- Add markup tracking column
ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_percent NUMERIC DEFAULT 30;

-- Add CJ tracking columns to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS cj_category_id TEXT,
  ADD COLUMN IF NOT EXISTS cj_parent_id TEXT,
  ADD COLUMN IF NOT EXISTS default_markup NUMERIC DEFAULT 30;
