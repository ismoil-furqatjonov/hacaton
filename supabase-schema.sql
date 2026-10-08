-- ============================================================
-- DONOR Platform — Supabase Database Schema
-- Versiya: 1.0.0
-- ============================================================

-- Qon guruhlarini enum sifatida belgilash
CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE donor_status AS ENUM ('available', 'busy', 'unavailable');
CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE request_status AS ENUM ('new', 'searching', 'donor_responded', 'agreed', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('blood_request', 'donor_response', 'new_message', 'request_status_changed', 'medication_reminder', 'admin_review');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');

-- ============================================================
-- 1. PROFILES (Auth bilan bog'liq)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  blood_group blood_group,
  region TEXT,
  avatar_url TEXT,
  donor_status donor_status NOT NULL DEFAULT 'unavailable',
  is_donor BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  donations_count INTEGER NOT NULL DEFAULT 0,
  helped_count INTEGER NOT NULL DEFAULT 0,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indekslar
CREATE INDEX idx_profiles_blood_group ON profiles(blood_group);
CREATE INDEX idx_profiles_donor_status ON profiles(donor_status);
CREATE INDEX idx_profiles_region ON profiles(region);
CREATE INDEX idx_profiles_is_donor ON profiles(is_donor);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. BLOOD REQUESTS
-- ============================================================

CREATE TABLE blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blood_group blood_group NOT NULL,
  quantity_units INTEGER NOT NULL DEFAULT 1 CHECK (quantity_units > 0 AND quantity_units <= 50),
  region TEXT NOT NULL,
  hospital TEXT,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  needed_by TIMESTAMPTZ,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  status request_status NOT NULL DEFAULT 'new',
  matched_donors INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blood_requests_blood_group ON blood_requests(blood_group);
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_blood_requests_urgency ON blood_requests(urgency);
CREATE INDEX idx_blood_requests_requester ON blood_requests(requester_id);
CREATE INDEX idx_blood_requests_created ON blood_requests(created_at DESC);

CREATE TRIGGER blood_requests_updated_at
  BEFORE UPDATE ON blood_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. REQUEST RESPONSES
-- ============================================================

CREATE TABLE request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, donor_id) -- Bir donor bir so'rovga faqat bir marta javob beradi
);

CREATE INDEX idx_request_responses_request ON request_responses(request_id);
CREATE INDEX idx_request_responses_donor ON request_responses(donor_id);

-- ============================================================
-- 4. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- 5. CONVERSATIONS (Chat)
-- ============================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, donor_id, requester_id)
);

CREATE INDEX idx_conversations_donor ON conversations(donor_id);
CREATE INDEX idx_conversations_requester ON conversations(requester_id);

-- ============================================================
-- 6. MESSAGES
-- ============================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ============================================================
-- 7. MEDICATION REMINDERS
-- ============================================================

CREATE TABLE medication_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL CHECK (length(medication_name) > 0 AND length(medication_name) <= 200),
  start_time TIME NOT NULL,
  repeat_count INTEGER NOT NULL DEFAULT 1 CHECK (repeat_count >= 1 AND repeat_count <= 100),
  repeat_interval_minutes INTEGER NOT NULL DEFAULT 480 CHECK (repeat_interval_minutes >= 1),
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_reminders_user ON medication_reminders(user_id);
CREATE INDEX idx_medication_reminders_active ON medication_reminders(user_id, is_active);

CREATE TRIGGER medication_reminders_updated_at
  BEFORE UPDATE ON medication_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. MEDICATION LOGS
-- ============================================================

CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id UUID NOT NULL REFERENCES medication_reminders(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('taken', 'skipped', 'snoozed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medication_logs_reminder ON medication_logs(reminder_id);

-- ============================================================
-- 9. REPORTS (Shikoyatlar)
-- ============================================================

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status report_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);

CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. BLOCKED USERS
-- ============================================================

CREATE TABLE blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================
-- 11. ADMIN AUDIT LOGS
-- ============================================================

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);

-- ============================================================
-- 10. APPROVED CATALOGS (Qon guruhlari va Tasdiqlangan dorilar)
-- FAQAT ADMIN TOMONIDAN QO'SHILADI VA TAHRIRLANADI!
-- ============================================================

CREATE TABLE approved_blood_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE approved_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  standard_dosage TEXT,
  contraindications TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_approved_blood_code ON approved_blood_groups(code);
CREATE INDEX idx_approved_med_name ON approved_medications(name);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Siyosatlari
-- ============================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_blood_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_medications ENABLE ROW LEVEL SECURITY;

-- -------- approved_blood_groups --------
CREATE POLICY "Tasdiqlangan qon guruhlari hammaga ko'rinadi" ON approved_blood_groups
  FOR SELECT USING (true);

CREATE POLICY "Faqat admin qon guruhlarini boshqaradi" ON approved_blood_groups
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- -------- approved_medications --------
CREATE POLICY "Tasdiqlangan dorilar katalogi hammaga ko'rinadi" ON approved_medications
  FOR SELECT USING (true);

CREATE POLICY "Faqat admin dorilar katalogini boshqaradi" ON approved_medications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- -------- profiles --------
CREATE POLICY "Profillar hammaga ko'rinadi" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Foydalanuvchi o'z profilini yangilaydi" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Foydalanuvchi o'z profilini yaratadi" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- XAVFSIZLIK: Oddiy foydalanuvchi o'zini o'zi admin qilib ko'tara olmasligi uchun tekshiruv
CREATE OR REPLACE FUNCTION prevent_unauthorized_admin_elevation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Faqat mavjud adminlar is_admin maydonini o'zgartira oladi
    IF NOT EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    ) THEN
      RAISE EXCEPTION 'Xavfsizlik: Foydalanuvchi admin maqomini mustaqil o''zgartira olmaydi!';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER check_admin_elevation
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_unauthorized_admin_elevation();

-- -------- blood_requests --------
CREATE POLICY "So'rovlar hammaga ko'rinadi" ON blood_requests
  FOR SELECT USING (true);

CREATE POLICY "Foydalanuvchi so'rov yaratadi" ON blood_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "So'rov egasi yangilaydi" ON blood_requests
  FOR UPDATE USING (auth.uid() = requester_id);

CREATE POLICY "Admin barcha so'rovlarni yangilaydi" ON blood_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- -------- request_responses --------
CREATE POLICY "Tegishli tomonlar javoblarni ko'radi" ON request_responses
  FOR SELECT USING (
    auth.uid() = donor_id OR
    EXISTS (SELECT 1 FROM blood_requests WHERE id = request_id AND requester_id = auth.uid())
  );

CREATE POLICY "Donor javob beradi" ON request_responses
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- -------- notifications --------
CREATE POLICY "Foydalanuvchi o'z bildirishnomalarini ko'radi" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi bildirishnomalarini o'qigan qiladi" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- -------- conversations --------
CREATE POLICY "Suhbat ishtirokchilari ko'radi" ON conversations
  FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = requester_id);

CREATE POLICY "Tegishli tomonlar suhbat yaratadi" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = donor_id OR auth.uid() = requester_id);

-- -------- messages --------
CREATE POLICY "Suhbat ishtirokchilari xabar ko'radi" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (donor_id = auth.uid() OR requester_id = auth.uid())
    )
  );

CREATE POLICY "Suhbat ishtirokchilari xabar yuboradi" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND (donor_id = auth.uid() OR requester_id = auth.uid())
      AND is_blocked = false
    )
  );

-- -------- medication_reminders --------
CREATE POLICY "Foydalanuvchi o'z eslatmalarini ko'radi" ON medication_reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Foydalanuvchi o'z eslatmalarini boshqaradi" ON medication_reminders
  FOR ALL USING (auth.uid() = user_id);

-- -------- medication_logs --------
CREATE POLICY "Foydalanuvchi o'z dori loglarini ko'radi" ON medication_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM medication_reminders WHERE id = reminder_id AND user_id = auth.uid())
  );

-- -------- reports --------
CREATE POLICY "Foydalanuvchi shikoyat yuboradi" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admin shikoyatlarni ko'radi" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- -------- blocked_users --------
CREATE POLICY "Foydalanuvchi bloklagan ro'yxatini ko'radi" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Foydalanuvchi bloklaydi" ON blocked_users
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

-- -------- admin_audit_logs --------
CREATE POLICY "Admin audit loglarini ko'radi" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- Foydalanuvchi yaratilganda avtomatik profil yaratish
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, blood_group, region)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Yangi foydalanuvchi'),
    (NEW.raw_user_meta_data->>'blood_group')::blood_group,
    NEW.raw_user_meta_data->>'region'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Demo ma'lumotlar (Hackathon uchun)
-- ESLATMA: Bu haqiqiy insonlar emas!
-- ============================================================

-- Admin foydalanuvchi yaratish (real Supabase Auth UUID kiritish kerak)
-- UPDATE profiles SET is_admin = true WHERE email = 'admin@donor.uz';
