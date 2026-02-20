-- ============================================================================
-- RosterFlow - Seed Team Data for Olujare Juwon
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================
-- Creates ~20 worship team members with proper role assignments:
--   6 Sopranos, 4 Altos, 3 Tenors, 2 Guitarists, 1 Bass Guitar,
--   1 Drummer, 1 Keyboard, 1 Sound Engineer, 1 Worship Leader (user)
-- ============================================================================

DO $$
DECLARE
  v_user_id       UUID;
  v_org_id        UUID;
  v_team_id       UUID;
  v_member_ids    UUID[];
  v_tm_ids        UUID[];
  v_role_ids      JSONB := '{}'::JSONB;
  v_new_uid       UUID;
  v_tm_id         UUID;
  v_role_id       UUID;

BEGIN
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 1. Find Olujare Juwon
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SELECT id INTO v_user_id
  FROM profiles
  WHERE full_name ILIKE '%Olujare%' OR full_name ILIKE '%Juwon%'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Could not find user "Olujare Juwon" in profiles table';
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 2. Find their organization
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SELECT organization_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    -- Create an org for them
    INSERT INTO organizations (name, created_by)
    VALUES ('Grace Community Church', v_user_id)
    RETURNING id INTO v_org_id;

    INSERT INTO org_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'super_admin');

    RAISE NOTICE 'Created organization: %', v_org_id;
  ELSE
    RAISE NOTICE 'Found organization: %', v_org_id;
  END IF;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 3. Find or create a music team
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SELECT id INTO v_team_id
  FROM teams
  WHERE org_id = v_org_id AND template_type = 'music'
  LIMIT 1;

  IF v_team_id IS NULL THEN
    INSERT INTO teams (org_id, name, template_type, description)
    VALUES (v_org_id, 'Sunday Worship Team', 'music', 'Main Sunday service worship team')
    RETURNING id INTO v_team_id;

    RAISE NOTICE 'Created team: %', v_team_id;
  ELSE
    RAISE NOTICE 'Found team: %', v_team_id;
  END IF;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 4. Clean up existing seed data (idempotent re-run)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DELETE FROM member_roles WHERE team_member_id IN (
    SELECT id FROM team_members WHERE team_id = v_team_id
  );
  DELETE FROM team_members WHERE team_id = v_team_id;
  DELETE FROM team_roles WHERE team_id = v_team_id;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 5. Create team roles (matching the MUSIC_ROLES constants)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO team_roles (team_id, name, category, sort_order, min_required)
  VALUES
    (v_team_id, 'Worship Leader',      'leadership',   1, 1),
    (v_team_id, 'Soprano',             'vocals',       2, 0),
    (v_team_id, 'Alto',                'vocals',       3, 0),
    (v_team_id, 'Tenor',               'vocals',       4, 0),
    (v_team_id, 'Bass (Voice)',        'vocals',       5, 0),
    (v_team_id, 'Electric Guitar',     'instruments',  6, 0),
    (v_team_id, 'Acoustic Guitar',     'instruments',  7, 0),
    (v_team_id, 'Bass Guitar',         'instruments',  8, 0),
    (v_team_id, 'Drummer',             'instruments',  9, 0),
    (v_team_id, 'Keyboard',            'instruments', 10, 0),
    (v_team_id, 'Piano',               'instruments', 11, 0),
    (v_team_id, 'Sound Engineer',      'tech',        12, 1),
    (v_team_id, 'Projection / Lyrics', 'tech',        13, 0),
    (v_team_id, 'Livestream Operator', 'tech',        14, 0);

  -- Store role IDs by name for later
  SELECT jsonb_object_agg(name, id) INTO v_role_ids
  FROM team_roles
  WHERE team_id = v_team_id;

  RAISE NOTICE 'Created % team roles', (SELECT count(*) FROM team_roles WHERE team_id = v_team_id);

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 6. Create fake auth users + profiles for team members
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- We need auth.users entries because profiles FK references auth.users(id)
  -- Using gen_random_uuid() for each fake member

  -- Helper: create a fake user and return their UUID
  -- We'll use a temporary table to batch this

  CREATE TEMP TABLE IF NOT EXISTS _seed_members (
    idx       SERIAL,
    uid       UUID DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email     TEXT NOT NULL,
    roles     TEXT[] NOT NULL  -- which team role names this member can fill
  ) ON COMMIT DROP;

  TRUNCATE _seed_members;

  -- ── Sopranos (6) ──
  INSERT INTO _seed_members (full_name, email, roles) VALUES
    ('Adaeze Okonkwo',   'adaeze.okonkwo@example.com',   ARRAY['Soprano']),
    ('Ngozi Eze',        'ngozi.eze@example.com',         ARRAY['Soprano']),
    ('Chidinma Nwankwo', 'chidinma.nwankwo@example.com',  ARRAY['Soprano']),
    ('Folashade Bakare', 'folashade.bakare@example.com',  ARRAY['Soprano']),
    ('Blessing Okafor',  'blessing.okafor@example.com',   ARRAY['Soprano']),
    ('Ifeoma Uche',      'ifeoma.uche@example.com',       ARRAY['Soprano']);

  -- ── Altos (4) ──
  INSERT INTO _seed_members (full_name, email, roles) VALUES
    ('Amara Chukwu',     'amara.chukwu@example.com',      ARRAY['Alto']),
    ('Kemi Adeyemi',     'kemi.adeyemi@example.com',       ARRAY['Alto']),
    ('Yetunde Afolabi',  'yetunde.afolabi@example.com',    ARRAY['Alto']),
    ('Grace Obi',        'grace.obi@example.com',          ARRAY['Alto']);

  -- ── Tenors (3) ──
  INSERT INTO _seed_members (full_name, email, roles) VALUES
    ('Emeka Okafor',     'emeka.okafor@example.com',       ARRAY['Tenor']),
    ('Tunde Adebayo',    'tunde.adebayo@example.com',      ARRAY['Tenor']),
    ('Chidi Nnamdi',     'chidi.nnamdi@example.com',        ARRAY['Tenor']);

  -- ── Instrumentalists ──
  INSERT INTO _seed_members (full_name, email, roles) VALUES
    ('David Ogunyemi',   'david.ogunyemi@example.com',     ARRAY['Electric Guitar', 'Acoustic Guitar']),
    ('Samuel Adekunle',  'samuel.adekunle@example.com',     ARRAY['Acoustic Guitar']),
    ('Joshua Okoro',     'joshua.okoro@example.com',        ARRAY['Bass Guitar']),
    ('Daniel Fashola',   'daniel.fashola@example.com',      ARRAY['Drummer']),
    ('Michael Balogun',  'michael.balogun@example.com',     ARRAY['Keyboard', 'Piano']);

  -- ── Tech ──
  INSERT INTO _seed_members (full_name, email, roles) VALUES
    ('Tochukwu Ibe',     'tochukwu.ibe@example.com',       ARRAY['Sound Engineer']),
    ('Segun Ajayi',      'segun.ajayi@example.com',         ARRAY['Projection / Lyrics', 'Livestream Operator']);

  -- Insert into auth.users (minimal fields required by Supabase)
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  SELECT
    sm.uid,
    '00000000-0000-0000-0000-000000000000'::UUID,
    'authenticated',
    'authenticated',
    sm.email,
    crypt('password123', gen_salt('bf')),  -- dummy password
    now(),
    '{"provider":"email","providers":["email"]}'::JSONB,
    jsonb_build_object('full_name', sm.full_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  FROM _seed_members sm
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles
  INSERT INTO profiles (id, email, full_name)
  SELECT sm.uid, sm.email, sm.full_name
  FROM _seed_members sm
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  RAISE NOTICE 'Created % fake user profiles', (SELECT count(*) FROM _seed_members);

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 7. Add all members to the team (including Olujare as admin + worship leader)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  -- Add Olujare Juwon as team admin + worship leader
  INSERT INTO team_members (team_id, user_id, is_team_admin)
  VALUES (v_team_id, v_user_id, true)
  ON CONFLICT (team_id, user_id) DO UPDATE SET is_team_admin = true
  RETURNING id INTO v_tm_id;

  -- Link Olujare to Worship Leader role
  SELECT (v_role_ids->>'Worship Leader')::UUID INTO v_role_id;
  INSERT INTO member_roles (team_member_id, team_role_id, proficiency)
  VALUES (v_tm_id, v_role_id, 'expert')
  ON CONFLICT (team_member_id, team_role_id) DO NOTHING;

  -- Add all seed members
  INSERT INTO team_members (team_id, user_id, is_team_admin)
  SELECT v_team_id, sm.uid, false
  FROM _seed_members sm
  ON CONFLICT (team_id, user_id) DO NOTHING;

  -- Also add seed members to the org
  INSERT INTO org_members (organization_id, user_id, role)
  SELECT v_org_id, sm.uid, 'member'
  FROM _seed_members sm
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 8. Create member_roles (which roles each member can fill)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  INSERT INTO member_roles (team_member_id, team_role_id, proficiency)
  SELECT
    tm.id,
    (v_role_ids->>role_name)::UUID,
    'standard'
  FROM _seed_members sm
    CROSS JOIN LATERAL unnest(sm.roles) AS role_name
    JOIN team_members tm ON tm.team_id = v_team_id AND tm.user_id = sm.uid
  WHERE v_role_ids->>role_name IS NOT NULL
  ON CONFLICT (team_member_id, team_role_id) DO NOTHING;

  RAISE NOTICE '✅ Seed complete!';
  RAISE NOTICE '   Organization: %', v_org_id;
  RAISE NOTICE '   Team: %', v_team_id;
  RAISE NOTICE '   Total members: % (+ Olujare Juwon as Worship Leader)', (SELECT count(*) FROM _seed_members);
  RAISE NOTICE '   Sopranos: 6, Altos: 4, Tenors: 3, Instrumentalists: 5, Tech: 2';

END $$;

-- ============================================================================
-- Verify the seed data
-- ============================================================================
SELECT
  p.full_name,
  p.email,
  tm.is_team_admin,
  array_agg(tr.name ORDER BY tr.sort_order) AS roles
FROM team_members tm
  JOIN profiles p ON p.id = tm.user_id
  LEFT JOIN member_roles mr ON mr.team_member_id = tm.id
  LEFT JOIN team_roles tr ON tr.id = mr.team_role_id
WHERE tm.team_id = (
  SELECT t.id FROM teams t
  JOIN org_members om ON om.organization_id = t.org_id
  JOIN profiles p2 ON p2.id = om.user_id
  WHERE p2.full_name ILIKE '%Olujare%' OR p2.full_name ILIKE '%Juwon%'
  LIMIT 1
)
GROUP BY p.full_name, p.email, tm.is_team_admin
ORDER BY tm.is_team_admin DESC, p.full_name;
