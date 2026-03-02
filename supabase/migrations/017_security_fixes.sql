-- ============================================================
-- 017: Security fixes — RLS on reminder_logs + function search_path
-- ============================================================

-- 1. Enable RLS on reminder_logs
ALTER TABLE public.reminder_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read reminder logs (for admin dashboards)
CREATE POLICY "reminder_logs_select_authenticated"
  ON public.reminder_logs FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role / edge functions to insert (they run as postgres, bypasses RLS)
-- No explicit insert policy needed for service_role, but add one for safety
CREATE POLICY "reminder_logs_insert_authenticated"
  ON public.reminder_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Fix function search_path on all flagged functions

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.org_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_org_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.org_members
  WHERE user_id = auth.uid() AND organization_id = org_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role IN ('super_admin', 'team_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
