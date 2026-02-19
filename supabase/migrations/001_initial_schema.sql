-- ============================================================================
-- RosterFlow - Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organization Memberships
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('super_admin', 'team_admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('music', 'church_event', 'custom')),
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team Roles
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  sort_order INT DEFAULT 0,
  min_required INT DEFAULT 1,
  max_allowed INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_team_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Member Roles (which roles a member can fill)
CREATE TABLE member_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  team_role_id UUID REFERENCES team_roles(id) ON DELETE CASCADE,
  proficiency TEXT DEFAULT 'standard',
  UNIQUE(team_member_id, team_role_id)
);

-- Rosters
CREATE TABLE rosters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'custom', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  share_token TEXT UNIQUE,
  signature_fields JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roster Events
CREATE TABLE roster_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  notes TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roster Assignments
CREATE TABLE roster_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_event_id UUID REFERENCES roster_events(id) ON DELETE CASCADE,
  team_role_id UUID REFERENCES team_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(roster_event_id, team_role_id, user_id)
);

-- Availability
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, team_id, date)
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

-- ============================================================================
-- Auto-create profile on signup (trigger)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- ── Profiles ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Org members can view each other's profiles"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT om.user_id FROM org_members om
      WHERE om.organization_id IN (
        SELECT organization_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- ── Organizations ─────────────────────────────────────────────────────────────
CREATE POLICY "Org members can view their organization"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can update their organization"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- ── Org Members ───────────────────────────────────────────────────────────────
CREATE POLICY "Org members can view org membership"
  ON org_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage org members"
  ON org_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Users can insert their own org membership"
  ON org_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ── Teams ─────────────────────────────────────────────────────────────────────
CREATE POLICY "Org members can view teams"
  ON teams FOR SELECT
  USING (
    org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'team_admin')
    )
  );

-- ── Team Roles ────────────────────────────────────────────────────────────────
CREATE POLICY "Team members can view roles"
  ON team_roles FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage team roles"
  ON team_roles FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Team Members ──────────────────────────────────────────────────────────────
CREATE POLICY "Team members can view team membership"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage team members"
  ON team_members FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Member Roles ──────────────────────────────────────────────────────────────
CREATE POLICY "Team members can view member roles"
  ON member_roles FOR SELECT
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage member roles"
  ON member_roles FOR ALL
  USING (
    team_member_id IN (
      SELECT tm.id FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Rosters ───────────────────────────────────────────────────────────────────
CREATE POLICY "Team members can view published rosters"
  ON rosters FOR SELECT
  USING (
    (status = 'published' AND team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid()
    ))
    OR
    (team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    ))
  );

CREATE POLICY "Public share token access"
  ON rosters FOR SELECT
  USING (status = 'published' AND share_token IS NOT NULL);

CREATE POLICY "Admins can manage rosters"
  ON rosters FOR ALL
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Roster Events ─────────────────────────────────────────────────────────────
CREATE POLICY "Roster event access follows roster access"
  ON roster_events FOR SELECT
  USING (
    roster_id IN (SELECT id FROM rosters)
  );

CREATE POLICY "Admins can manage roster events"
  ON roster_events FOR ALL
  USING (
    roster_id IN (
      SELECT r.id FROM rosters r
      JOIN teams t ON t.id = r.team_id
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Roster Assignments ────────────────────────────────────────────────────────
CREATE POLICY "Assignment access follows roster access"
  ON roster_assignments FOR SELECT
  USING (
    roster_event_id IN (SELECT id FROM roster_events)
  );

CREATE POLICY "Admins can manage assignments"
  ON roster_assignments FOR ALL
  USING (
    roster_event_id IN (
      SELECT re.id FROM roster_events re
      JOIN rosters r ON r.id = re.roster_id
      JOIN teams t ON t.id = r.team_id
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Availability ──────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own availability"
  ON availability FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view team availability"
  ON availability FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_members om ON om.organization_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('super_admin', 'team_admin')
    )
  );

-- ── Invitations ───────────────────────────────────────────────────────────────
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'team_admin')
    )
  );

CREATE POLICY "Anyone can view invitation by token"
  ON invitations FOR SELECT
  USING (true);

-- ============================================================================
-- Updated_at auto-update trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON rosters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
