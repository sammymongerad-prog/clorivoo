CREATE TABLE IF NOT EXISTS kyc_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  doc_type TEXT,
  doc_front_url TEXT,
  doc_back_url TEXT,
  selfie_url TEXT,
  first_name TEXT,
  last_name TEXT,
  birth_date TEXT,
  phone TEXT,
  nationality TEXT,
  country TEXT,
  shop_name TEXT,
  shop_description TEXT,
  shop_category TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE kyc_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seller_own_kyc" ON kyc_requests FOR ALL USING (seller_id = auth.uid());
CREATE POLICY "admin_all_kyc" ON kyc_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
