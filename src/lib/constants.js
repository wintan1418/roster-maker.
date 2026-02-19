// ── User roles ──────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TEAM_ADMIN: 'team_admin',
  MEMBER: 'member',
};

// ── Roster lifecycle statuses ───────────────────────────────────────────────
export const ROSTER_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

// ── Scheduling period types ─────────────────────────────────────────────────
export const PERIOD_TYPES = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom',
  YEARLY: 'yearly',
};

// ── Music ministry roles ────────────────────────────────────────────────────
// min_required = suggested starting quantity (user can change freely)
// No max_allowed — the user decides how many they need per service
export const MUSIC_ROLES = [
  { name: 'Worship Leader', category: 'leadership', min_required: 1 },
  { name: 'Soprano', category: 'vocals', group: 'Backing Vocals', min_required: 0 },
  { name: 'Alto', category: 'vocals', group: 'Backing Vocals', min_required: 0 },
  { name: 'Tenor', category: 'vocals', group: 'Backing Vocals', min_required: 0 },
  { name: 'Bass (Voice)', category: 'vocals', group: 'Backing Vocals', min_required: 0 },
  { name: 'Electric Guitar', category: 'instruments', min_required: 0 },
  { name: 'Acoustic Guitar', category: 'instruments', min_required: 0 },
  { name: 'Bass Guitar', category: 'instruments', min_required: 0 },
  { name: 'Drummer', category: 'instruments', min_required: 0 },
  { name: 'Keyboard', category: 'instruments', min_required: 0 },
  { name: 'Piano', category: 'instruments', min_required: 0 },
  { name: 'Sound Engineer', category: 'tech', min_required: 1 },
  { name: 'Projection / Lyrics', category: 'tech', min_required: 0 },
  { name: 'Livestream Operator', category: 'tech', min_required: 0 },
];

// ── Church event roles ──────────────────────────────────────────────────────
export const CHURCH_EVENT_ROLES = [
  { name: 'Event Coordinator', category: 'leadership', min_required: 1 },
  { name: 'MC / Host', category: 'leadership', min_required: 1 },
  { name: 'Usher', category: 'hospitality', min_required: 2 },
  { name: 'Greeter', category: 'hospitality', min_required: 1 },
  { name: 'Kids Ministry', category: 'ministry', min_required: 1 },
  { name: 'Prayer Team', category: 'ministry', min_required: 1 },
  { name: 'Communion Server', category: 'ministry', min_required: 0 },
  { name: 'Scripture Reader', category: 'ministry', min_required: 0 },
  { name: 'Setup / Teardown', category: 'logistics', min_required: 2 },
  { name: 'Catering / Kitchen', category: 'logistics', min_required: 0 },
  { name: 'Parking Attendant', category: 'logistics', min_required: 0 },
];

// ── Template types with default role sets ───────────────────────────────────
export const TEMPLATE_TYPES = {
  music: {
    label: 'Music / Worship Team',
    description: 'Sunday services, worship nights, and music rehearsals',
    defaultRoles: MUSIC_ROLES,
  },
  church_event: {
    label: 'Church Event',
    description: 'General church events, conferences, and special services',
    defaultRoles: CHURCH_EVENT_ROLES,
  },
  custom: {
    label: 'Custom',
    description: 'Start with a blank slate and define your own roles',
    defaultRoles: [],
  },
};
