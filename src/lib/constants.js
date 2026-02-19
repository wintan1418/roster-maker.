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
export const MUSIC_ROLES = [
  { name: 'Worship Leader', category: 'leadership', min_required: 1, max_allowed: 1 },
  { name: 'Vocalist', category: 'vocals', min_required: 1, max_allowed: 4 },
  { name: 'Backing Vocalist', category: 'vocals', min_required: 0, max_allowed: 3 },
  { name: 'Electric Guitar', category: 'instruments', min_required: 0, max_allowed: 2 },
  { name: 'Acoustic Guitar', category: 'instruments', min_required: 0, max_allowed: 2 },
  { name: 'Bass Guitar', category: 'instruments', min_required: 1, max_allowed: 1 },
  { name: 'Drummer', category: 'instruments', min_required: 1, max_allowed: 1 },
  { name: 'Keyboard', category: 'instruments', min_required: 0, max_allowed: 2 },
  { name: 'Piano', category: 'instruments', min_required: 0, max_allowed: 1 },
  { name: 'Sound Engineer', category: 'tech', min_required: 1, max_allowed: 2 },
  { name: 'Projection / Lyrics', category: 'tech', min_required: 1, max_allowed: 1 },
  { name: 'Livestream Operator', category: 'tech', min_required: 0, max_allowed: 1 },
];

// ── Church event roles ──────────────────────────────────────────────────────
export const CHURCH_EVENT_ROLES = [
  { name: 'Event Coordinator', category: 'leadership', min_required: 1, max_allowed: 1 },
  { name: 'MC / Host', category: 'leadership', min_required: 1, max_allowed: 2 },
  { name: 'Usher', category: 'hospitality', min_required: 2, max_allowed: 6 },
  { name: 'Greeter', category: 'hospitality', min_required: 1, max_allowed: 4 },
  { name: 'Kids Ministry', category: 'ministry', min_required: 1, max_allowed: 4 },
  { name: 'Prayer Team', category: 'ministry', min_required: 1, max_allowed: 4 },
  { name: 'Communion Server', category: 'ministry', min_required: 0, max_allowed: 4 },
  { name: 'Scripture Reader', category: 'ministry', min_required: 0, max_allowed: 2 },
  { name: 'Setup / Teardown', category: 'logistics', min_required: 2, max_allowed: 6 },
  { name: 'Catering / Kitchen', category: 'logistics', min_required: 0, max_allowed: 4 },
  { name: 'Parking Attendant', category: 'logistics', min_required: 0, max_allowed: 3 },
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
