-- ============================================================================
-- Fix: Infinite recursion in org_members RLS policies
-- The org_members policies were querying org_members to check access,
-- causing infinite recursion. Fix: use a SECURITY DEFINER function
-- that bypasses RLS to look up the user's org memberships.
-- ============================================================================

-- Helper function: get org IDs for the current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.org_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get user's role in an org (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_org_role(org_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.org_members
  WHERE user_id = auth.uid() AND organization_id = org_id
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if user is admin in any org
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role IN ('super_admin', 'team_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- Drop ALL existing policies and recreate with the helper functions
-- ============================================================================

-- ── Drop org_members policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Org members can view org membership" ON org_members;
DROP POLICY IF EXISTS "Super admins can manage org members" ON org_members;
DROP POLICY IF EXISTS "Users can insert their own org membership" ON org_members;

-- ── Drop organizations policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "Org members can view their organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Super admins can update their organization" ON organizations;

-- ── Drop profiles policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Org members can view each other's profiles" ON profiles;

-- ── Drop teams policies ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Org members can view teams" ON teams;
DROP POLICY IF EXISTS "Admins can manage teams" ON teams;

-- ── Drop team_roles policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Team members can view roles" ON team_roles;
DROP POLICY IF EXISTS "Admins can manage team roles" ON team_roles;

-- ── Drop team_members policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "Team members can view team membership" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- ── Drop member_roles policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "Team members can view member roles" ON member_roles;
DROP POLICY IF EXISTS "Admins can manage member roles" ON member_roles;

-- ── Drop rosters policies ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Team members can view published rosters" ON rosters;
DROP POLICY IF EXISTS "Public share token access" ON rosters;
DROP POLICY IF EXISTS "Admins can manage rosters" ON rosters;

-- ── Drop roster_events policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "Roster event access follows roster access" ON roster_events;
DROP POLICY IF EXISTS "Admins can manage roster events" ON roster_events;

-- ── Drop roster_assignments policies ─────────────────────────────────────
DROP POLICY IF EXISTS "Assignment access follows roster access" ON roster_assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON roster_assignments;

-- ── Drop availability policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage their own availability" ON availability;
DROP POLICY IF EXISTS "Admins can view team availability" ON availability;

-- ── Drop invitations policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage invitations" ON invitations;
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON invitations;

-- ============================================================================
-- Recreate all policies using helper functions (no recursion)
-- ============================================================================

-- ── Profiles ──────────────────────────────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_select_org_peers"
  ON profiles FOR SELECT
  USING (id IN (
    SELECT om.user_id FROM org_members om
    WHERE om.organization_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Organizations ─────────────────────────────────────────────────────────
CREATE POLICY "orgs_select"
  ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "orgs_insert"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "orgs_update"
  ON organizations FOR UPDATE
  USING (get_user_org_role(id) = 'super_admin');

-- ── Org Members (the previously recursive table) ─────────────────────────
CREATE POLICY "org_members_select_own"
  ON org_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "org_members_select_peers"
  ON org_members FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_members_insert_own"
  ON org_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "org_members_insert_admin"
  ON org_members FOR INSERT
  WITH CHECK (is_org_admin(organization_id));

CREATE POLICY "org_members_update_admin"
  ON org_members FOR UPDATE
  USING (is_org_admin(organization_id));

CREATE POLICY "org_members_delete_admin"
  ON org_members FOR DELETE
  USING (is_org_admin(organization_id));

-- ── Teams ─────────────────────────────────────────────────────────────────
CREATE POLICY "teams_select"
  ON teams FOR SELECT
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "teams_insert"
  ON teams FOR INSERT
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "teams_update"
  ON teams FOR UPDATE
  USING (is_org_admin(org_id));

CREATE POLICY "teams_delete"
  ON teams FOR DELETE
  USING (is_org_admin(org_id));

-- ── Team Roles ────────────────────────────────────────────────────────────
CREATE POLICY "team_roles_select"
  ON team_roles FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE org_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "team_roles_manage"
  ON team_roles FOR ALL
  USING (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ));

-- ── Team Members ──────────────────────────────────────────────────────────
CREATE POLICY "team_members_select"
  ON team_members FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE org_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "team_members_manage"
  ON team_members FOR ALL
  USING (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ));

-- ── Member Roles ──────────────────────────────────────────────────────────
CREATE POLICY "member_roles_select"
  ON member_roles FOR SELECT
  USING (team_member_id IN (
    SELECT tm.id FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.org_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "member_roles_manage"
  ON member_roles FOR ALL
  USING (team_member_id IN (
    SELECT tm.id FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE is_org_admin(t.org_id)
  ));

-- ── Rosters ───────────────────────────────────────────────────────────────
CREATE POLICY "rosters_select"
  ON rosters FOR SELECT
  USING (
    team_id IN (SELECT id FROM teams WHERE org_id IN (SELECT get_user_org_ids()))
  );

CREATE POLICY "rosters_select_public"
  ON rosters FOR SELECT
  USING (status = 'published' AND share_token IS NOT NULL);

CREATE POLICY "rosters_manage"
  ON rosters FOR ALL
  USING (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ));

-- ── Roster Events ─────────────────────────────────────────────────────────
CREATE POLICY "roster_events_select"
  ON roster_events FOR SELECT
  USING (roster_id IN (
    SELECT r.id FROM rosters r
    JOIN teams t ON t.id = r.team_id
    WHERE t.org_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "roster_events_manage"
  ON roster_events FOR ALL
  USING (roster_id IN (
    SELECT r.id FROM rosters r
    JOIN teams t ON t.id = r.team_id
    WHERE is_org_admin(t.org_id)
  ));

-- ── Roster Assignments ────────────────────────────────────────────────────
CREATE POLICY "roster_assignments_select"
  ON roster_assignments FOR SELECT
  USING (roster_event_id IN (
    SELECT re.id FROM roster_events re
    JOIN rosters r ON r.id = re.roster_id
    JOIN teams t ON t.id = r.team_id
    WHERE t.org_id IN (SELECT get_user_org_ids())
  ));

CREATE POLICY "roster_assignments_manage"
  ON roster_assignments FOR ALL
  USING (roster_event_id IN (
    SELECT re.id FROM roster_events re
    JOIN rosters r ON r.id = re.roster_id
    JOIN teams t ON t.id = r.team_id
    WHERE is_org_admin(t.org_id)
  ));

-- ── Availability ──────────────────────────────────────────────────────────
CREATE POLICY "availability_own"
  ON availability FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "availability_admin_view"
  ON availability FOR SELECT
  USING (team_id IN (
    SELECT id FROM teams WHERE is_org_admin(org_id)
  ));

-- ── Invitations ───────────────────────────────────────────────────────────
CREATE POLICY "invitations_select_all"
  ON invitations FOR SELECT
  USING (true);

CREATE POLICY "invitations_manage"
  ON invitations FOR ALL
  USING (is_org_admin(org_id));
