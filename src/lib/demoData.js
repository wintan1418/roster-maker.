/**
 * Demo data for roster features.
 * Used when Supabase is not connected.
 */

// ── Demo Teams ──────────────────────────────────────────────────────────────
export const DEMO_TEAMS = [
  { id: 'team-1', name: 'Music / Worship Team', organization_id: 'org-1' },
  { id: 'team-2', name: 'Ushers & Hospitality', organization_id: 'org-1' },
  { id: 'team-3', name: 'Kids Ministry', organization_id: 'org-1' },
];

// ── Demo Roles (per team) ───────────────────────────────────────────────────
export const DEMO_ROLES = {
  'team-1': [
    { id: 'role-1', name: 'Worship Leader', team_id: 'team-1' },
    { id: 'role-2', name: 'Vocalist', team_id: 'team-1' },
    { id: 'role-3', name: 'Keyboard', team_id: 'team-1' },
    { id: 'role-4', name: 'Drummer', team_id: 'team-1' },
    { id: 'role-5', name: 'Bass Guitar', team_id: 'team-1' },
    { id: 'role-6', name: 'Acoustic Guitar', team_id: 'team-1' },
    { id: 'role-7', name: 'Sound Engineer', team_id: 'team-1' },
  ],
  'team-2': [
    { id: 'role-8', name: 'Head Usher', team_id: 'team-2' },
    { id: 'role-9', name: 'Door Usher', team_id: 'team-2' },
    { id: 'role-10', name: 'Greeter', team_id: 'team-2' },
    { id: 'role-11', name: 'Offering Collector', team_id: 'team-2' },
  ],
  'team-3': [
    { id: 'role-12', name: 'Lead Teacher', team_id: 'team-3' },
    { id: 'role-13', name: 'Assistant', team_id: 'team-3' },
    { id: 'role-14', name: 'Craft Leader', team_id: 'team-3' },
  ],
};

// ── Demo Members ────────────────────────────────────────────────────────────
export const DEMO_MEMBERS = [
  {
    id: 'mem-1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    roleIds: ['role-1', 'role-2', 'role-6'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-2',
    name: 'David Chen',
    email: 'david@example.com',
    roleIds: ['role-3', 'role-1'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-3',
    name: 'Emily Naidoo',
    email: 'emily@example.com',
    roleIds: ['role-2', 'role-6'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-4',
    name: 'Michael Brown',
    email: 'michael@example.com',
    roleIds: ['role-4'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-5',
    name: 'Jessica Williams',
    email: 'jessica@example.com',
    roleIds: ['role-5', 'role-3'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-6',
    name: 'Daniel Kim',
    email: 'daniel@example.com',
    roleIds: ['role-7', 'role-3'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-7',
    name: 'Rachel Moyo',
    email: 'rachel@example.com',
    roleIds: ['role-2', 'role-1'],
    teamIds: ['team-1'],
  },
  {
    id: 'mem-8',
    name: 'James Wilson',
    email: 'james@example.com',
    roleIds: ['role-4', 'role-7'],
    teamIds: ['team-1'],
  },
  // Ushers team
  {
    id: 'mem-9',
    name: 'Grace Okafor',
    email: 'grace@example.com',
    roleIds: ['role-8', 'role-9'],
    teamIds: ['team-2'],
  },
  {
    id: 'mem-10',
    name: 'Peter van der Merwe',
    email: 'peter@example.com',
    roleIds: ['role-9', 'role-10', 'role-11'],
    teamIds: ['team-2'],
  },
  {
    id: 'mem-11',
    name: 'Linda Mthembu',
    email: 'linda@example.com',
    roleIds: ['role-10', 'role-11'],
    teamIds: ['team-2'],
  },
  {
    id: 'mem-12',
    name: 'Thomas Ndlovu',
    email: 'thomas@example.com',
    roleIds: ['role-8', 'role-9', 'role-11'],
    teamIds: ['team-2'],
  },
];

// ── Demo Availability (memberId -> array of unavailable dates) ──────────────
export const DEMO_UNAVAILABILITY = {
  'mem-1': ['2026-03-08', '2026-03-15'],
  'mem-2': ['2026-03-22'],
  'mem-3': ['2026-03-01'],
  'mem-4': ['2026-03-08', '2026-03-29'],
  'mem-5': [],
  'mem-6': ['2026-03-15'],
  'mem-7': ['2026-03-01', '2026-03-22'],
  'mem-8': ['2026-03-08'],
  'mem-9': ['2026-03-15'],
  'mem-10': [],
  'mem-11': ['2026-03-08'],
  'mem-12': ['2026-03-22', '2026-03-29'],
};

// ── Demo Rosters ────────────────────────────────────────────────────────────
export const DEMO_ROSTERS = [
  {
    id: 'roster-1',
    title: 'March 2026 Music Roster',
    team_id: 'team-1',
    team_name: 'Music / Worship Team',
    status: 'draft',
    period_type: 'monthly',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    created_at: '2026-02-15T08:00:00Z',
    published_at: null,
    event_count: 5,
  },
  {
    id: 'roster-2',
    title: 'March 2026 Ushers Roster',
    team_id: 'team-2',
    team_name: 'Ushers & Hospitality',
    status: 'published',
    period_type: 'monthly',
    start_date: '2026-03-01',
    end_date: '2026-03-31',
    created_at: '2026-02-10T08:00:00Z',
    published_at: '2026-02-14T10:30:00Z',
    event_count: 5,
  },
  {
    id: 'roster-3',
    title: 'Feb 2026 Music Roster',
    team_id: 'team-1',
    team_name: 'Music / Worship Team',
    status: 'archived',
    period_type: 'monthly',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    created_at: '2026-01-20T08:00:00Z',
    published_at: '2026-01-28T09:00:00Z',
    event_count: 4,
  },
];

// ── Demo Events (per roster) ────────────────────────────────────────────────
export const DEMO_EVENTS = {
  'roster-1': [
    { id: 'evt-1', roster_id: 'roster-1', name: 'Sunday Service', date: '2026-03-01', time: '09:00' },
    { id: 'evt-2', roster_id: 'roster-1', name: 'Sunday Service', date: '2026-03-08', time: '09:00' },
    { id: 'evt-3', roster_id: 'roster-1', name: 'Sunday Service', date: '2026-03-15', time: '09:00' },
    { id: 'evt-4', roster_id: 'roster-1', name: 'Sunday Service', date: '2026-03-22', time: '09:00' },
    { id: 'evt-5', roster_id: 'roster-1', name: 'Sunday Service', date: '2026-03-29', time: '09:00' },
  ],
  'roster-2': [
    { id: 'evt-6', roster_id: 'roster-2', name: 'Sunday Service', date: '2026-03-01', time: '09:00' },
    { id: 'evt-7', roster_id: 'roster-2', name: 'Sunday Service', date: '2026-03-08', time: '09:00' },
    { id: 'evt-8', roster_id: 'roster-2', name: 'Sunday Service', date: '2026-03-15', time: '09:00' },
    { id: 'evt-9', roster_id: 'roster-2', name: 'Sunday Service', date: '2026-03-22', time: '09:00' },
    { id: 'evt-10', roster_id: 'roster-2', name: 'Sunday Service', date: '2026-03-29', time: '09:00' },
  ],
  'roster-3': [
    { id: 'evt-11', roster_id: 'roster-3', name: 'Sunday Service', date: '2026-02-01', time: '09:00' },
    { id: 'evt-12', roster_id: 'roster-3', name: 'Sunday Service', date: '2026-02-08', time: '09:00' },
    { id: 'evt-13', roster_id: 'roster-3', name: 'Sunday Service', date: '2026-02-15', time: '09:00' },
    { id: 'evt-14', roster_id: 'roster-3', name: 'Sunday Service', date: '2026-02-22', time: '09:00' },
  ],
};

// ── Demo Assignments ────────────────────────────────────────────────────────
// Key format: `${eventId}-${roleId}` -> { memberId, manual }
export const DEMO_ASSIGNMENTS = {
  'roster-1': {
    'evt-1-role-1': { memberId: 'mem-2', manual: true },
    'evt-1-role-2': { memberId: 'mem-3', manual: false },
    'evt-1-role-3': { memberId: 'mem-5', manual: false },
    'evt-1-role-4': { memberId: 'mem-4', manual: false },
    'evt-2-role-1': { memberId: 'mem-7', manual: false },
    'evt-2-role-5': { memberId: 'mem-5', manual: true },
    'evt-3-role-1': { memberId: 'mem-2', manual: false },
    'evt-3-role-2': { memberId: 'mem-3', manual: false },
    'evt-3-role-7': { memberId: 'mem-6', manual: true },
  },
  'roster-2': {
    'evt-6-role-8': { memberId: 'mem-9', manual: true },
    'evt-6-role-9': { memberId: 'mem-10', manual: false },
    'evt-6-role-10': { memberId: 'mem-11', manual: false },
    'evt-7-role-8': { memberId: 'mem-12', manual: false },
    'evt-7-role-9': { memberId: 'mem-10', manual: false },
    'evt-8-role-8': { memberId: 'mem-9', manual: false },
    'evt-8-role-10': { memberId: 'mem-11', manual: false },
    'evt-9-role-8': { memberId: 'mem-12', manual: true },
    'evt-9-role-9': { memberId: 'mem-10', manual: false },
    'evt-10-role-8': { memberId: 'mem-9', manual: false },
  },
  'roster-3': {},
};

/**
 * Get all members for a specific team.
 */
export function getDemoMembersForTeam(teamId) {
  return DEMO_MEMBERS.filter((m) => m.teamIds.includes(teamId));
}

/**
 * Get all roles for a specific team.
 */
export function getDemoRolesForTeam(teamId) {
  return DEMO_ROLES[teamId] || [];
}

/**
 * Check if a member is available on a given date.
 */
export function isMemberAvailable(memberId, dateStr) {
  const unavailDates = DEMO_UNAVAILABILITY[memberId] || [];
  return !unavailDates.includes(dateStr);
}

/**
 * Get a member by ID.
 */
export function getDemoMember(memberId) {
  return DEMO_MEMBERS.find((m) => m.id === memberId) || null;
}

/**
 * Get eligible members for a given role on a given date.
 * Eligible = has the role + is available on that date.
 */
export function getEligibleMembers(teamId, roleId, dateStr) {
  const teamMembers = getDemoMembersForTeam(teamId);
  return teamMembers.filter(
    (m) => m.roleIds.includes(roleId) && isMemberAvailable(m.id, dateStr)
  );
}
