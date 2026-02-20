import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

import PublicRoster from '@/components/public/PublicRoster';
import EmailLookup from '@/components/public/EmailLookup';
import PersonalSchedule from '@/components/public/PersonalSchedule';
import useRosterStore from '@/stores/rosterStore';

export default function PublicRosterPage() {
  const { shareToken } = useParams();
  const location = useLocation();
  const isPersonalView = location.pathname.endsWith('/me');

  const { fetchPublicRoster } = useRosterStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch roster data on mount
  useEffect(() => {
    if (!shareToken) {
      setError('No share token provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicRoster(shareToken).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err || !data) {
        setError('Roster not found or no longer available.');
      } else {
        setRosterData(data);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [shareToken, fetchPublicRoster]);

  // ── Transform fetched data into the format PublicRoster components expect ──

  // roles: array of role name strings (columns)
  const roles = useMemo(() => {
    if (!rosterData?.roleConfig) return [];
    return rosterData.roleConfig.map((r) => r.name);
  }, [rosterData]);

  // events: [{ id, date, label }]
  const events = useMemo(() => {
    if (!rosterData?.events) return [];
    return rosterData.events.map((e) => ({
      id: e.id,
      date: e.event_date,
      label: e.event_name,
      time: e.event_time,
    }));
  }, [rosterData]);

  // assignments: { [eventId]: { [roleName]: memberName } }
  // Source format: { "eventId-roleSlotId": { memberId, manual } }
  const displayAssignments = useMemo(() => {
    if (!rosterData) return {};
    const { assignments, roleConfig, members } = rosterData;

    // Build lookup maps
    const roleById = {};
    for (const r of (roleConfig || [])) {
      roleById[r.id] = r.name;
    }
    const memberById = {};
    for (const m of (members || [])) {
      memberById[m.id] = m;
      if (m.user_id) memberById[m.user_id] = m;
    }

    const result = {};
    const allEvents = rosterData.events || [];
    for (const [key, value] of Object.entries(assignments || {})) {
      if (!value?.memberId) continue;
      // Keys are "eventId-roleSlotId" but both are UUIDs containing dashes.
      // Use startsWith to find the correct event.
      const evt = allEvents.find((e) => key.startsWith(e.id + '-'));
      if (!evt) continue;
      const eventId = evt.id;
      const roleSlotId = key.slice(eventId.length + 1);
      const roleName = roleById[roleSlotId];
      const member = memberById[value.memberId];
      if (!roleName || !member) continue;

      if (!result[eventId]) result[eventId] = {};
      result[eventId][roleName] = member.name;
    }
    return result;
  }, [rosterData]);

  // members for EmailLookup: [{ id, name, email }]
  const lookupMembers = useMemo(() => {
    if (!rosterData?.members) return [];
    return rosterData.members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
    }));
  }, [rosterData]);

  // Personal duties for the selected member
  const personalDuties = useMemo(() => {
    if (!selectedMember || !rosterData) return [];
    const duties = [];
    for (const event of events) {
      const eventAssignments = displayAssignments[event.id] || {};
      for (const [role, memberName] of Object.entries(eventAssignments)) {
        if (memberName === selectedMember.name) {
          duties.push({ date: event.date, eventLabel: event.label, role });
        }
      }
    }
    return duties;
  }, [selectedMember, rosterData, events, displayAssignments]);

  const handleMemberFound = useCallback((member) => {
    setSelectedMember(member);
  }, []);

  const handleBackFromSchedule = useCallback(() => {
    setSelectedMember(null);
  }, []);

  // ── Loading / error states ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <p className="text-surface-500 text-sm">Loading roster...</p>
      </div>
    );
  }

  if (error || !rosterData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center px-4">
        <AlertCircle size={40} className="text-red-400" />
        <h2 className="text-lg font-semibold text-surface-900">Roster Not Found</h2>
        <p className="text-surface-500 text-sm max-w-sm">
          {error || 'This roster may have been unpublished or the link is invalid.'}
        </p>
      </div>
    );
  }

  const { roster, team, organization } = rosterData;

  const orgInfo = {
    name: organization?.name || team?.name || 'Organization',
  };
  const teamInfo = { name: team?.name || '' };
  const rosterInfo = {
    name: roster.title,
    period: roster.start_date && roster.end_date
      ? `${roster.start_date} – ${roster.end_date}`
      : '',
    status: 'Published',
  };

  // ── Personal view: /r/:shareToken/me ─────────────────────────────────────
  if (isPersonalView) {
    if (selectedMember) {
      return (
        <PersonalSchedule
          organization={orgInfo}
          team={teamInfo}
          roster={rosterInfo}
          member={selectedMember}
          duties={personalDuties}
          onBack={handleBackFromSchedule}
        />
      );
    }
    return (
      <EmailLookup
        members={lookupMembers}
        organizationName={orgInfo.name}
        teamName={teamInfo.name}
        onMemberFound={handleMemberFound}
      />
    );
  }

  // ── Full roster view: /r/:shareToken ─────────────────────────────────────
  return (
    <PublicRoster
      organization={orgInfo}
      team={teamInfo}
      roster={rosterInfo}
      roles={roles}
      events={events}
      assignments={displayAssignments}
    />
  );
}
