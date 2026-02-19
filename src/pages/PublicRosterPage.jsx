import { useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PublicRoster from '@/components/public/PublicRoster';
import EmailLookup from '@/components/public/EmailLookup';
import PersonalSchedule from '@/components/public/PersonalSchedule';

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_ORG = {
  name: 'Grace Community Church',
  address: '1425 Maple Avenue, Springfield, IL 62704',
  phone: '(217) 555-0183',
  email: 'info@gracecommunity.org',
};

const DEMO_TEAM = {
  name: 'Music Ministry',
};

const DEMO_ROSTER = {
  name: 'March 2026 Schedule',
  period: 'March 2026',
  status: 'Published',
};

const DEMO_ROLES = [
  'Worship Leader',
  'Vocalist',
  'Keyboard',
  'Electric Guitar',
  'Bass Guitar',
  'Drummer',
  'Sound Engineer',
];

const DEMO_MEMBERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    roles: ['Worship Leader', 'Vocalist'],
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    roles: ['Keyboard'],
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    roles: ['Vocalist'],
  },
  {
    id: '4',
    name: 'David Thompson',
    email: 'david.thompson@email.com',
    roles: ['Electric Guitar'],
  },
  {
    id: '5',
    name: 'Rachel Kim',
    email: 'rachel.kim@email.com',
    roles: ['Bass Guitar'],
  },
  {
    id: '6',
    name: 'James Williams',
    email: 'james.williams@email.com',
    roles: ['Drummer'],
  },
  {
    id: '7',
    name: 'Grace Okafor',
    email: 'grace.okafor@email.com',
    roles: ['Sound Engineer'],
  },
  {
    id: '8',
    name: 'Daniel Park',
    email: 'daniel.park@email.com',
    roles: ['Worship Leader', 'Electric Guitar'],
  },
];

const DEMO_EVENTS = [
  { id: 'e1', date: '2026-03-01', label: 'Sunday Worship Service' },
  { id: 'e2', date: '2026-03-08', label: 'Sunday Worship Service' },
  { id: 'e3', date: '2026-03-15', label: 'Sunday Worship Service' },
  { id: 'e4', date: '2026-03-22', label: 'Sunday Worship Service' },
  { id: 'e5', date: '2026-03-29', label: 'Palm Sunday Special Service' },
];

const DEMO_ASSIGNMENTS = {
  e1: {
    'Worship Leader': 'Sarah Johnson',
    Vocalist: 'Emily Rodriguez',
    Keyboard: 'Michael Chen',
    'Electric Guitar': 'David Thompson',
    'Bass Guitar': 'Rachel Kim',
    Drummer: 'James Williams',
    'Sound Engineer': 'Grace Okafor',
  },
  e2: {
    'Worship Leader': 'Daniel Park',
    Vocalist: 'Sarah Johnson',
    Keyboard: 'Michael Chen',
    'Electric Guitar': 'Daniel Park',
    'Bass Guitar': 'Rachel Kim',
    Drummer: 'James Williams',
    'Sound Engineer': 'Grace Okafor',
  },
  e3: {
    'Worship Leader': 'Sarah Johnson',
    Vocalist: 'Emily Rodriguez',
    Keyboard: 'Michael Chen',
    'Electric Guitar': 'David Thompson',
    'Bass Guitar': 'Rachel Kim',
    Drummer: 'James Williams',
    'Sound Engineer': 'Grace Okafor',
  },
  e4: {
    'Worship Leader': 'Daniel Park',
    Vocalist: 'Emily Rodriguez',
    Keyboard: 'Michael Chen',
    'Electric Guitar': 'David Thompson',
    'Bass Guitar': 'Rachel Kim',
    Drummer: 'James Williams',
    'Sound Engineer': 'Grace Okafor',
  },
  e5: {
    'Worship Leader': 'Sarah Johnson',
    Vocalist: 'Emily Rodriguez',
    Keyboard: 'Michael Chen',
    'Electric Guitar': 'Daniel Park',
    'Bass Guitar': 'Rachel Kim',
    Drummer: 'James Williams',
    'Sound Engineer': 'Grace Okafor',
  },
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function PublicRosterPage() {
  const { shareToken } = useParams();
  const location = useLocation();
  const isPersonalView = location.pathname.endsWith('/me');

  const [selectedMember, setSelectedMember] = useState(null);

  // Derive personal duties for a given member
  const personalDuties = useMemo(() => {
    if (!selectedMember) return [];

    const duties = [];
    DEMO_EVENTS.forEach((event) => {
      const eventAssignments = DEMO_ASSIGNMENTS[event.id] || {};
      Object.entries(eventAssignments).forEach(([role, memberName]) => {
        if (memberName === selectedMember.name) {
          duties.push({
            date: event.date,
            eventLabel: event.label,
            role,
          });
        }
      });
    });

    return duties;
  }, [selectedMember]);

  const handleMemberFound = useCallback((member) => {
    setSelectedMember(member);
  }, []);

  const handleBackFromSchedule = useCallback(() => {
    setSelectedMember(null);
  }, []);

  // ── Personal view: /r/:shareToken/me ──────────────────────────────────────
  if (isPersonalView) {
    // If a member has been looked up, show their schedule
    if (selectedMember) {
      return (
        <PersonalSchedule
          organization={DEMO_ORG}
          team={DEMO_TEAM}
          roster={DEMO_ROSTER}
          member={selectedMember}
          duties={personalDuties}
          onBack={handleBackFromSchedule}
        />
      );
    }

    // Otherwise show the email lookup form
    return (
      <EmailLookup
        members={DEMO_MEMBERS}
        organizationName={DEMO_ORG.name}
        teamName={DEMO_TEAM.name}
        onMemberFound={handleMemberFound}
      />
    );
  }

  // ── Full roster view: /r/:shareToken ──────────────────────────────────────
  return (
    <PublicRoster
      organization={DEMO_ORG}
      team={DEMO_TEAM}
      roster={DEMO_ROSTER}
      roles={DEMO_ROLES}
      events={DEMO_EVENTS}
      assignments={DEMO_ASSIGNMENTS}
    />
  );
}
