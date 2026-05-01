-- ═══════════════════════════════════════════════════════════════
-- BACK2ME GLOBAL — Database Migration
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════

-- ── 1. PROFILES (extends auth.users) ─────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'plus', 'elite')),
  plan_status TEXT DEFAULT 'incomplete' CHECK (plan_status IN ('active', 'past_due', 'cancelled', 'incomplete')),
  tag_limit INTEGER DEFAULT 3,
  shipping_name TEXT,
  shipping_street TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_zip TEXT,
  shipping_country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. TAGS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qr_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wristband', 'pet_tag', 'luggage_tag', 'sticker')),
  color TEXT CHECK (color IN ('orange', 'navy')),
  size TEXT CHECK (size IN ('1x1', '2x2')),
  status TEXT DEFAULT 'unregistered' CHECK (status IN ('unregistered', 'active', 'inactive')),
  assigned_to TEXT,
  category TEXT CHECK (category IN ('child', 'pet', 'luggage', 'personal', 'equipment', 'other')),
  owner_message TEXT,
  medical_info TEXT,
  photo_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- ── 3. EMERGENCY CONTACTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. SCAN EVENTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  finder_session_id TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  city TEXT,
  country TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. MESSAGES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  scan_id UUID REFERENCES scan_events(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('finder', 'owner')),
  finder_session_id TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'location', 'photo')),
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own tags" ON tags
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read active tags" ON tags
  FOR SELECT USING (status = 'active');
CREATE POLICY "Anyone can read unregistered tags" ON tags
  FOR SELECT USING (status = 'unregistered');

-- Emergency Contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage contacts" ON emergency_contacts
  FOR ALL USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );
CREATE POLICY "Public read contacts of active tags" ON emergency_contacts
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE status = 'active')
  );

-- Scan Events
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own scans" ON scan_events
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );
CREATE POLICY "Anyone can insert scans" ON scan_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners update own scans" ON scan_events
  FOR UPDATE USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read own messages" ON messages
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );
CREATE POLICY "Finders read by session" ON messages
  FOR SELECT USING (finder_session_id IS NOT NULL);
CREATE POLICY "Anyone can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES (performance)
-- ═══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_qr_code ON tags(qr_code);
CREATE INDEX IF NOT EXISTS idx_scan_events_tag_id ON scan_events(tag_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_created_at ON scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_scan_id ON messages(scan_id);
CREATE INDEX IF NOT EXISTS idx_messages_tag_id ON messages(tag_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_tag_id ON emergency_contacts(tag_id);

-- ═══════════════════════════════════════════════════════════════
-- REALTIME (enable for chat)
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE scan_events;

-- ═══════════════════════════════════════════════════════════════
-- SEED: Sample QR codes (pre-printed tags ready to be activated)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO tags (qr_code, type, color, status) VALUES
  ('B2M-WR-7X3K', 'wristband', 'orange', 'unregistered'),
  ('B2M-WR-9M2L', 'wristband', 'navy', 'unregistered'),
  ('B2M-PT-4R8N', 'pet_tag', 'orange', 'unregistered'),
  ('B2M-PT-6T1Q', 'pet_tag', 'navy', 'unregistered'),
  ('B2M-LT-2W5J', 'luggage_tag', 'orange', 'unregistered'),
  ('B2M-LT-8P3V', 'luggage_tag', 'navy', 'unregistered'),
  ('B2M-ST-1A9C', 'sticker', 'orange', 'unregistered'),
  ('B2M-ST-3D7F', 'sticker', 'navy', 'unregistered')
ON CONFLICT (qr_code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- STORAGE ROW LEVEL SECURITY (tag-photos bucket)
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Allow public read access to tag photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'tag-photos');

CREATE POLICY "Allow authenticated uploads to tag photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'tag-photos');

-- ═══════════════════════════════════════════════════════════════
-- 11. SUPPORT / TICKETING SUPPORT
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS support_flag BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS support_notes TEXT;

CREATE POLICY "Allow users to update their own tag photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'tag-photos' AND auth.uid() = owner);

CREATE POLICY "Allow users to delete their own tag photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'tag-photos' AND auth.uid() = owner);

-- ═══════════════════════════════════════════════════════════════
-- CHAT SESSIONS & PRIVACY
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  finder_session_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tag_id, finder_session_id)
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners update own chat sessions" ON chat_sessions
  FOR UPDATE USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners read own chat sessions" ON chat_sessions
  FOR SELECT USING (
    tag_id IN (SELECT id FROM tags WHERE user_id = auth.uid())
  );

CREATE POLICY "Finders read own chat sessions" ON chat_sessions
  FOR SELECT USING (
    finder_session_id IS NOT NULL
  );

CREATE POLICY "Finders insert chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

-- Update messages insertion logic to respect closed sessions
DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;
CREATE POLICY "Insert messages if session is not closed" ON messages
  FOR INSERT WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.tag_id = messages.tag_id 
      AND chat_sessions.finder_session_id = messages.finder_session_id 
      AND chat_sessions.status = 'closed'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- STORAGE ROW LEVEL SECURITY (chat-photos bucket)
-- ═══════════════════════════════════════════════════════════════

-- Since Finders are anonymous, uploads are proxied through a secure Next.js Admin route (/api/chat/upload).
-- But we need to ensure PUBLIC READ is allowed so the photos render seamlessly in the chat window.

CREATE POLICY "Allow public read access to chat photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-photos');

-- ═══════════════════════════════════════════════════════════════
-- 9. SHIPMENTS (MAIL IT BACK FEATURE)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
  
  -- Raw Data
  finder_address JSONB,
  
  -- Integration Identifiers
  easypost_shipment_id TEXT,
  stripe_payment_intent_id TEXT,
  selected_rate_id TEXT,
  
  -- Logistics Data
  tracking_code TEXT,
  label_url TEXT,
  status TEXT DEFAULT 'awaiting_owner_payment' CHECK (status IN ('awaiting_owner_payment', 'label_generated', 'in_transit', 'delivered')),

  -- Financial Data (Profit Margin)
  base_cost NUMERIC(10,2),
  markup_amount NUMERIC(10,2),
  final_price NUMERIC(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Shipments
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their shipments" ON shipments
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update their shipments" ON shipments
  FOR UPDATE USING (auth.uid() = owner_id);

-- System creates shipments, bypassing RLS via Admin Client

-- ═══════════════════════════════════════════════════════════════
-- 10. ADMIN PANEL SUPPORT
-- ═══════════════════════════════════════════════════════════════

-- Add role column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'support'));

-- Create Admin Audit Logs table to track sensitive actions
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Admin Audit Logs
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only superusers or Admins bypassing RLS via Admin Client can insert/read
CREATE POLICY "Admins bypass RLS for audit logs" ON admin_audit_logs
  FOR ALL USING (false); -- Handled securely via backend `createAdminClient()` only

-- ═══════════════════════════════════════════════════════════════
-- 12. INVENTORY MANAGEMENT (ADMIN)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS inventory_skus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('wristband', 'sticker', 'luggage_tag', 'pet_tag')),
  color TEXT NOT NULL CHECK (color IN ('orange', 'navy')),
  size TEXT CHECK (size IN ('1x1', '2x2', null)),
  stock_level INTEGER DEFAULT 0,
  sold_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(type, color, size)
);

CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id UUID REFERENCES inventory_skus(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('production_add', 'manual_adjustment', 'sold_deduction', 'loss_damage')),
  qty_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Inventory
ALTER TABLE inventory_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins bypass RLS for inventory skus" ON inventory_skus FOR ALL USING (false);
CREATE POLICY "Admins bypass RLS for inventory ledger" ON inventory_ledger FOR ALL USING (false);

-- Seed Initial SKUs based on user instructions
INSERT INTO inventory_skus (name, type, color, size) VALUES
  ('Wristband - Orange', 'wristband', 'orange', null),
  ('Wristband - Blue', 'wristband', 'navy', null),
  ('Sticker - Orange 1x1', 'sticker', 'orange', '1x1'),
  ('Sticker - Blue 1x1', 'sticker', 'navy', '1x1'),
  ('Sticker - Orange 2x2', 'sticker', 'orange', '2x2'),
  ('Sticker - Blue 2x2', 'sticker', 'navy', '2x2'),
  ('Luggage Tag - Orange', 'luggage_tag', 'orange', null),
  ('Luggage Tag - Blue', 'luggage_tag', 'navy', null),
  ('Pet Tag - Orange', 'pet_tag', 'orange', null),
  ('Pet Tag - Blue', 'pet_tag', 'navy', null)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 13. MARKETING & ANALYTICS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS marketing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token UUID NOT NULL UNIQUE,
  channel TEXT DEFAULT 'Direct',
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  converted_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Marketing Analytics
ALTER TABLE marketing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert marketing session" ON marketing_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Admins bypass RLS for marketing" ON marketing_sessions FOR ALL USING (false);

