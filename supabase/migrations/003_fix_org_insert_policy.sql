-- Fix: Allow any authenticated user to create an organization
-- The previous policy was correct but let's make sure it's clean

DROP POLICY IF EXISTS "orgs_insert" ON organizations;

CREATE POLICY "orgs_insert"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix: allow users to insert their own org_members row during signup
-- (they need to add themselves as super_admin right after creating the org)
DROP POLICY IF EXISTS "org_members_insert_own" ON org_members;

CREATE POLICY "org_members_insert_own"
  ON org_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
