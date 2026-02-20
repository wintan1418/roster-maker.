import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xhtcwugqkyvprrbbjznp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhodGN3dWdxa3l2cHJyYmJqem5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUzMjk2NiwiZXhwIjoyMDg3MTA4OTY2fQ.9vcG4BFTIGzG8SJqxfKfGo3wgaYZhJ0Hz1Wi4Xf83A8',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Seed members ────────────────────────────────────────────────────────────
const SEED_MEMBERS = [
  // 6 Sopranos
  { name: 'Adaeze Okonkwo',   email: 'adaeze.okonkwo@example.com',   roles: ['Soprano'] },
  { name: 'Ngozi Eze',        email: 'ngozi.eze@example.com',         roles: ['Soprano'] },
  { name: 'Chidinma Nwankwo', email: 'chidinma.nwankwo@example.com',  roles: ['Soprano'] },
  { name: 'Folashade Bakare', email: 'folashade.bakare@example.com',  roles: ['Soprano'] },
  { name: 'Blessing Okafor',  email: 'blessing.okafor@example.com',   roles: ['Soprano'] },
  { name: 'Ifeoma Uche',      email: 'ifeoma.uche@example.com',       roles: ['Soprano'] },
  // 4 Altos
  { name: 'Amara Chukwu',     email: 'amara.chukwu@example.com',      roles: ['Alto'] },
  { name: 'Kemi Adeyemi',     email: 'kemi.adeyemi@example.com',       roles: ['Alto'] },
  { name: 'Yetunde Afolabi',  email: 'yetunde.afolabi@example.com',    roles: ['Alto'] },
  { name: 'Grace Obi',        email: 'grace.obi@example.com',          roles: ['Alto'] },
  // 3 Tenors
  { name: 'Emeka Okafor',     email: 'emeka.okafor@example.com',       roles: ['Tenor'] },
  { name: 'Tunde Adebayo',    email: 'tunde.adebayo@example.com',      roles: ['Tenor'] },
  { name: 'Chidi Nnamdi',     email: 'chidi.nnamdi@example.com',        roles: ['Tenor'] },
  // Instrumentalists
  { name: 'David Ogunyemi',   email: 'david.ogunyemi@example.com',     roles: ['Electric Guitar', 'Acoustic Guitar'] },
  { name: 'Samuel Adekunle',  email: 'samuel.adekunle@example.com',     roles: ['Acoustic Guitar'] },
  { name: 'Joshua Okoro',     email: 'joshua.okoro@example.com',        roles: ['Bass Guitar'] },
  { name: 'Daniel Fashola',   email: 'daniel.fashola@example.com',      roles: ['Drummer'] },
  { name: 'Michael Balogun',  email: 'michael.balogun@example.com',     roles: ['Keyboard', 'Piano'] },
  // Tech
  { name: 'Tochukwu Ibe',     email: 'tochukwu.ibe@example.com',       roles: ['Sound Engineer'] },
  { name: 'Segun Ajayi',      email: 'segun.ajayi@example.com',         roles: ['Projection / Lyrics', 'Livestream Operator'] },
];

const TEAM_ROLES = [
  { name: 'Worship Leader',      category: 'leadership',  sort_order: 1,  min_required: 1 },
  { name: 'Soprano',             category: 'vocals',      sort_order: 2,  min_required: 0 },
  { name: 'Alto',                category: 'vocals',      sort_order: 3,  min_required: 0 },
  { name: 'Tenor',               category: 'vocals',      sort_order: 4,  min_required: 0 },
  { name: 'Bass (Voice)',        category: 'vocals',      sort_order: 5,  min_required: 0 },
  { name: 'Electric Guitar',    category: 'instruments', sort_order: 6,  min_required: 0 },
  { name: 'Acoustic Guitar',    category: 'instruments', sort_order: 7,  min_required: 0 },
  { name: 'Bass Guitar',        category: 'instruments', sort_order: 8,  min_required: 0 },
  { name: 'Drummer',            category: 'instruments', sort_order: 9,  min_required: 0 },
  { name: 'Keyboard',           category: 'instruments', sort_order: 10, min_required: 0 },
  { name: 'Piano',              category: 'instruments', sort_order: 11, min_required: 0 },
  { name: 'Sound Engineer',     category: 'tech',        sort_order: 12, min_required: 1 },
  { name: 'Projection / Lyrics',category: 'tech',        sort_order: 13, min_required: 0 },
  { name: 'Livestream Operator',category: 'tech',        sort_order: 14, min_required: 0 },
];

async function seed() {
  console.log('🌱 Starting seed...\n');

  // ── 1. Find Olujare Juwon ──────────────────────────────────────────────
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .or('full_name.ilike.%Olujare%,full_name.ilike.%Juwon%')
    .limit(1);

  if (!profiles?.length) {
    console.error('❌ Could not find user "Olujare Juwon" in profiles');
    process.exit(1);
  }
  const user = profiles[0];
  console.log(`✅ Found user: ${user.full_name} (${user.id})`);

  // ── 2. Find their org ──────────────────────────────────────────────────
  let { data: orgMembers } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1);

  let orgId;
  if (orgMembers?.length) {
    orgId = orgMembers[0].organization_id;
    console.log(`✅ Found organization: ${orgId}`);
  } else {
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({ name: 'Grace Community Church', created_by: user.id })
      .select()
      .single();
    if (error) throw error;
    orgId = org.id;

    await supabase
      .from('org_members')
      .insert({ organization_id: orgId, user_id: user.id, role: 'super_admin' });

    console.log(`✅ Created organization: ${orgId}`);
  }

  // ── 3. Find or create music team ───────────────────────────────────────
  let { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('org_id', orgId)
    .eq('template_type', 'music')
    .limit(1);

  let teamId;
  if (teams?.length) {
    teamId = teams[0].id;
    console.log(`✅ Found team: ${teams[0].name} (${teamId})`);
  } else {
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        org_id: orgId,
        name: 'Sunday Worship Team',
        template_type: 'music',
        description: 'Main Sunday service worship team',
      })
      .select()
      .single();
    if (error) throw error;
    teamId = team.id;
    console.log(`✅ Created team: ${teamId}`);
  }

  // ── 4. Clean existing seed data ────────────────────────────────────────
  // Delete member_roles for this team's members
  const { data: existingTm } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId);

  if (existingTm?.length) {
    const tmIds = existingTm.map((t) => t.id);
    await supabase.from('member_roles').delete().in('team_member_id', tmIds);
  }
  await supabase.from('team_members').delete().eq('team_id', teamId);
  await supabase.from('team_roles').delete().eq('team_id', teamId);
  console.log('🧹 Cleaned existing team data');

  // ── 5. Create team roles ───────────────────────────────────────────────
  const { data: createdRoles, error: rolesErr } = await supabase
    .from('team_roles')
    .insert(TEAM_ROLES.map((r) => ({ ...r, team_id: teamId })))
    .select();

  if (rolesErr) throw rolesErr;

  const roleMap = {};
  for (const r of createdRoles) {
    roleMap[r.name] = r.id;
  }
  console.log(`✅ Created ${createdRoles.length} team roles`);

  // ── 6. Create fake users via admin API ─────────────────────────────────
  const memberUserIds = [];

  for (const m of SEED_MEMBERS) {
    // Check if user already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', m.email)
      .limit(1);

    let userId;
    if (existingProfiles?.length) {
      userId = existingProfiles[0].id;
    } else {
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: m.email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: { full_name: m.name },
      });

      if (authErr) {
        console.error(`  ⚠️  Failed to create ${m.name}: ${authErr.message}`);
        continue;
      }
      userId = authData.user.id;
    }

    memberUserIds.push({ userId, ...m });
    process.stdout.write('.');
  }
  console.log(`\n✅ Created/found ${memberUserIds.length} member accounts`);

  // ── 7. Add Olujare as team admin + Worship Leader ──────────────────────
  const { data: ownerTm } = await supabase
    .from('team_members')
    .upsert({ team_id: teamId, user_id: user.id, is_team_admin: true }, { onConflict: 'team_id,user_id' })
    .select()
    .single();

  if (ownerTm && roleMap['Worship Leader']) {
    await supabase
      .from('member_roles')
      .upsert(
        { team_member_id: ownerTm.id, team_role_id: roleMap['Worship Leader'], proficiency: 'expert' },
        { onConflict: 'team_member_id,team_role_id' }
      );
  }
  console.log(`✅ Added ${user.full_name} as Worship Leader + team admin`);

  // ── 8. Add seed members to org + team + roles ──────────────────────────
  for (const m of memberUserIds) {
    // Add to org
    await supabase
      .from('org_members')
      .upsert(
        { organization_id: orgId, user_id: m.userId, role: 'member' },
        { onConflict: 'organization_id,user_id' }
      );

    // Add to team
    const { data: tm } = await supabase
      .from('team_members')
      .upsert(
        { team_id: teamId, user_id: m.userId, is_team_admin: false },
        { onConflict: 'team_id,user_id' }
      )
      .select()
      .single();

    if (!tm) continue;

    // Add member_roles
    for (const roleName of m.roles) {
      const roleId = roleMap[roleName];
      if (!roleId) continue;
      await supabase
        .from('member_roles')
        .upsert(
          { team_member_id: tm.id, team_role_id: roleId, proficiency: 'standard' },
          { onConflict: 'team_member_id,team_role_id' }
        );
    }
    process.stdout.write('.');
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ SEED COMPLETE!');
  console.log('═══════════════════════════════════════════════════');
  console.log(`   Organization: ${orgId}`);
  console.log(`   Team:         ${teamId}`);
  console.log(`   Members:      ${memberUserIds.length + 1} (including ${user.full_name})`);
  console.log('   Breakdown:    6 Sopranos, 4 Altos, 3 Tenors');
  console.log('                 5 Instrumentalists, 2 Tech');
  console.log('                 1 Worship Leader (you)');
  console.log('═══════════════════════════════════════════════════');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
