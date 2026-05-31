-- CJ Dropshipping columns — run this once in your Supabase SQL editor
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS cj_pid TEXT,
  ADD COLUMN IF NOT EXISTS cj_source BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cj_category_id TEXT,
  ADD COLUMN IF NOT EXISTS markup_percent NUMERIC DEFAULT 30;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS cj_category_id TEXT,
  ADD COLUMN IF NOT EXISTS cj_parent_id TEXT,
  ADD COLUMN IF NOT EXISTS default_markup NUMERIC DEFAULT 30;

CREATE UNIQUE INDEX IF NOT EXISTS products_cj_pid_idx ON products(cj_pid) WHERE cj_pid IS NOT NULL;
