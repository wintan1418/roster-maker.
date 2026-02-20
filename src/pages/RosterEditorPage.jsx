import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PenLine,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import RosterCreator from '@/components/roster/RosterCreator';
import RosterGrid from '@/components/roster/RosterGrid';
import RosterPreview from '@/components/roster/RosterPreview';
import RosterPublish from '@/components/roster/RosterPublish';
import useRosterStore from '@/stores/rosterStore';
import useTeamStore from '@/stores/teamStore';
import useAuthStore from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { ROSTER_STATUS } from '@/lib/constants';

const VIEW = {
  CREATOR: 'creator',
  EDITOR: 'editor',
  PREVIEW: 'preview',
  PUBLISH: 'publish',
};

/**
 * Expand wizard roles (with quantity) into individual numbered slots.
 */
function expandRolesToSlots(roles) {
  const slots = [];
  for (const role of roles) {
    const qty = role.quantity || 0;
    if (qty === 0) continue;
    for (let i = 1; i <= qty; i++) {
      slots.push({
        id: qty > 1 ? `${role.id}__${i}` : role.id,
        name: qty > 1 ? `${role.name} ${i}` : role.name,
        originalRole: role,
        slotIndex: i,
      });
    }
  }
  return slots;
}

/**
 * Serialize role slots for the roleConfig portion of signature_fields.
 */
function serializeRoleConfig(slots) {
  return slots.map((s) => ({
    id: s.id,
    name: s.name,
    slotIndex: s.slotIndex,
    originalRoleName: s.originalRole?.name || s.name.replace(/\s+\d+$/, ''),
    category: s.originalRole?.category || 'custom',
  }));
}

/**
 * Parse signature_fields into { roleConfig, assignments }.
 * Handles both old array format and new object format.
 */
function parseSignatureFields(sf) {
  if (!sf) return { roleConfig: null, assignments: {} };

  // New object format: { roleConfig: [...], assignments: {...} }
  if (!Array.isArray(sf) && typeof sf === 'object' && sf.roleConfig) {
    const config = Array.isArray(sf.roleConfig) && sf.roleConfig.length > 0 && sf.roleConfig[0]?.originalRoleName
      ? sf.roleConfig.map((c) => ({
          id: c.id,
          name: c.name,
          slotIndex: c.slotIndex || 1,
          originalRole: { name: c.originalRoleName, category: c.category || 'custom' },
        }))
      : null;
    return { roleConfig: config, assignments: sf.assignments || {} };
  }

  // Old array format: [{ id, name, slotIndex, originalRoleName, category }, ...]
  if (Array.isArray(sf) && sf.length > 0 && sf[0]?.originalRoleName) {
    return {
      roleConfig: sf.map((c) => ({
        id: c.id,
        name: c.name,
        slotIndex: c.slotIndex || 1,
        originalRole: { name: c.originalRoleName, category: c.category || 'custom' },
      })),
      assignments: {},
    };
  }

  return { roleConfig: null, assignments: {} };
}

export default function RosterEditorPage() {
  const { rosterId } = useParams();
  const navigate = useNavigate();
  const isNew = !rosterId;

  const { fetchRoster, publishRoster } = useRosterStore();
  const { fetchTeamMembers, fetchTeamRoles, members, roles: teamRoles } = useTeamStore();
  const { user } = useAuthStore();

  const [currentView, setCurrentView] = useState(
    isNew ? VIEW.CREATOR : VIEW.EDITOR
  );
  const [roster, setRoster] = useState(null);
  const [events, setEvents] = useState([]);
  const [roleSlots, setRoleSlots] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState({});
  const [pageLoading, setPageLoading] = useState(!isNew);

  // ── Save role config + assignments to DB ──────────────────────────────────
  const saveRoleConfig = useCallback(
    async (slots, assignmentsOverride) => {
      if (!roster?.id || !supabase) return;
      const config = serializeRoleConfig(slots);
      const payload = {
        roleConfig: config,
        assignments: assignmentsOverride ?? currentAssignments,
      };
      await supabase
        .from('rosters')
        .update({ signature_fields: payload })
        .eq('id', roster.id);
    },
    [roster?.id, currentAssignments]
  );

  // ── Load existing roster ──────────────────────────────────────────────────
  useEffect(() => {
    if (!rosterId) return;
    let cancelled = false;

    async function loadRoster() {
      setPageLoading(true);
      try {
        const { data: rosterData, error: rosterErr } = await fetchRoster(rosterId);
        if (rosterErr) throw rosterErr;
        if (cancelled || !rosterData) return;

        setRoster(rosterData);
        setEvents(
          (rosterData.events ?? [])
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.event_date.localeCompare(b.event_date))
            .map((e) => ({
              id: e.id,
              roster_id: e.roster_id,
              name: e.event_name,
              date: e.event_date,
              time: e.event_time,
              sort_order: e.sort_order,
            }))
        );

        if (rosterData.team_id) {
          const [rolesResult] = await Promise.all([
            fetchTeamRoles(rosterData.team_id),
            fetchTeamMembers(rosterData.team_id),
          ]);
          if (cancelled) return;

          // Parse signature_fields for role config + saved assignments
          const { roleConfig: savedConfig, assignments: savedAssignments } =
            parseSignatureFields(rosterData.signature_fields);

          if (savedConfig) {
            setRoleSlots(savedConfig);
          } else {
            // Fallback: each DB role becomes one slot
            const dbRoles = rolesResult.data ?? [];
            setRoleSlots(dbRoles.map((r) => ({
              id: r.id,
              name: r.name,
              originalRole: r,
              slotIndex: 1,
            })));
          }

          // Restore saved assignments
          if (savedAssignments && Object.keys(savedAssignments).length > 0) {
            setCurrentAssignments(savedAssignments);
          }
        }

        setCurrentView(VIEW.EDITOR);
      } catch (err) {
        console.error('Failed to load roster:', err);
        toast.error('Failed to load roster. Please try again.');
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    }

    loadRoster();
    return () => { cancelled = true; };
  }, [rosterId, fetchRoster, fetchTeamRoles, fetchTeamMembers]);

  // ── Handle roster creation from wizard ────────────────────────────────────
  const handleCreate = useCallback(
    async (formData) => {
      try {
        // 1. Expand wizard roles into numbered slots
        const activeRoles = (formData.roles ?? []).filter((r) => (r.quantity || 0) > 0);
        const slots = expandRolesToSlots(activeRoles);

        // 2. Insert the roster row with role config saved
        const { data: newRoster, error: rosterErr } = await supabase
          .from('rosters')
          .insert({
            title: formData.title,
            team_id: formData.teamId || null,
            period_type: formData.periodType,
            start_date: formData.startDate,
            end_date: formData.endDate,
            status: ROSTER_STATUS.DRAFT,
            created_by: user?.id || null,
            signature_fields: { roleConfig: serializeRoleConfig(slots), assignments: {} },
          })
          .select()
          .single();

        if (rosterErr) throw rosterErr;

        // 3. Insert roster events
        let savedEvents = [];
        if (formData.events?.length > 0) {
          const eventRows = formData.events.map((evt, idx) => ({
            roster_id: newRoster.id,
            event_name: evt.name,
            event_date: evt.date,
            event_time: evt.time || null,
            sort_order: idx,
          }));

          const { data: evtData, error: evtErr } = await supabase
            .from('roster_events')
            .insert(eventRows)
            .select();

          if (evtErr) throw evtErr;
          savedEvents = (evtData ?? []).map((e) => ({
            id: e.id,
            roster_id: e.roster_id,
            name: e.event_name,
            date: e.event_date,
            time: e.event_time,
            sort_order: e.sort_order,
          }));
        }

        // 4. Fetch team members
        if (formData.teamId) {
          await fetchTeamMembers(formData.teamId);
        }

        // 5. Update local state
        setRoster({
          ...newRoster,
          team_name: formData.team_name || formData.teamName || formData.title,
        });
        setEvents(savedEvents);
        setRoleSlots(slots);
        setCurrentAssignments({});
        setCurrentView(VIEW.EDITOR);

        toast.success('Roster created! Start assigning members.');
        navigate(`/rosters/${newRoster.id}`, { replace: true });
      } catch (err) {
        console.error('Failed to create roster:', err);
        toast.error(err.message || 'Failed to create roster. Please try again.');
      }
    },
    [user, navigate, fetchTeamMembers]
  );

  const handleCancelCreate = useCallback(() => {
    navigate('/rosters');
  }, [navigate]);

  // ── Preview and publish handlers ──────────────────────────────────────────
  const handlePreview = useCallback((assignments) => {
    setCurrentAssignments(assignments);
    setCurrentView(VIEW.PREVIEW);
  }, []);

  const handlePublish = useCallback((assignments) => {
    setCurrentAssignments(assignments);
    setCurrentView(VIEW.PUBLISH);
  }, []);

  const handleSave = useCallback(async (assignments) => {
    setCurrentAssignments(assignments);
    if (!roster?.id || !supabase) return;
    const config = serializeRoleConfig(roleSlots);
    const payload = { roleConfig: config, assignments };
    const { error } = await supabase
      .from('rosters')
      .update({ signature_fields: payload })
      .eq('id', roster.id);
    if (error) {
      console.error('Failed to save assignments:', error);
      toast.error('Failed to save roster');
    }
  }, [roster?.id, roleSlots]);

  // ── Role column management ────────────────────────────────────────────────

  const handleDuplicateRole = useCallback((roleSlot) => {
    setRoleSlots((prev) => {
      const baseName = roleSlot.originalRole?.name || roleSlot.name.replace(/\s+\d+$/, '');
      const siblings = prev.filter(
        (s) => (s.originalRole?.name || s.name.replace(/\s+\d+$/, '')) === baseName
      );
      const maxIndex = Math.max(...siblings.map((s) => s.slotIndex || 1), 0);
      const newIndex = maxIndex + 1;

      const renumbered = prev.map((s) => {
        const sBase = s.originalRole?.name || s.name.replace(/\s+\d+$/, '');
        if (sBase !== baseName) return s;
        if (siblings.length === 1 && s.slotIndex === 1 && !s.name.match(/\s+\d+$/)) {
          return { ...s, id: `${s.originalRole?.id || s.id}__1`, name: `${baseName} 1`, slotIndex: 1 };
        }
        return s;
      });

      const newSlot = {
        id: `${roleSlot.originalRole?.id || roleSlot.id.replace(/__\d+$/, '')}__${newIndex}`,
        name: `${baseName} ${newIndex}`,
        originalRole: roleSlot.originalRole || { name: baseName },
        slotIndex: newIndex,
      };

      const lastSiblingIdx = renumbered.reduce(
        (acc, s, i) => ((s.originalRole?.name || s.name.replace(/\s+\d+$/, '')) === baseName ? i : acc),
        -1
      );

      const result = [...renumbered];
      result.splice(lastSiblingIdx + 1, 0, newSlot);

      // Save to DB
      saveRoleConfig(result);
      return result;
    });
    toast.success(`Added another ${roleSlot.originalRole?.name || roleSlot.name.replace(/\s+\d+$/, '')} column`);
  }, [saveRoleConfig]);

  const handleRemoveRole = useCallback((roleSlot) => {
    setRoleSlots((prev) => {
      const baseName = roleSlot.originalRole?.name || roleSlot.name.replace(/\s+\d+$/, '');
      const remaining = prev.filter((s) => s.id !== roleSlot.id);

      let counter = 0;
      const siblings = remaining.filter(
        (s) => (s.originalRole?.name || s.name.replace(/\s+\d+$/, '')) === baseName
      );

      let result;
      if (siblings.length === 1) {
        result = remaining.map((s) => {
          if (s.id === siblings[0].id) {
            return { ...s, name: baseName, slotIndex: 1, id: s.originalRole?.id || s.id.replace(/__\d+$/, '') };
          }
          return s;
        });
      } else {
        result = remaining.map((s) => {
          const sBase = s.originalRole?.name || s.name.replace(/\s+\d+$/, '');
          if (sBase !== baseName) return s;
          counter++;
          return {
            ...s,
            slotIndex: counter,
            name: `${baseName} ${counter}`,
            id: `${s.originalRole?.id || s.id.replace(/__\d+$/, '')}__${counter}`,
          };
        });
      }

      saveRoleConfig(result);
      return result;
    });

    setCurrentAssignments((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        if (key.endsWith(`-${roleSlot.id}`)) delete next[key];
      }
      return next;
    });
  }, [saveRoleConfig]);

  const handleAddRole = useCallback((roleName) => {
    setRoleSlots((prev) => {
      const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const result = [
        ...prev,
        {
          id: newId,
          name: roleName,
          originalRole: { name: roleName, category: 'custom' },
          slotIndex: 1,
        },
      ];
      saveRoleConfig(result);
      return result;
    });
    toast.success(`Added "${roleName}" column`);
  }, [saveRoleConfig]);

  // ── Event row management ──────────────────────────────────────────────────

  const handleAddEvent = useCallback(
    async ({ name, date, time }) => {
      if (!roster?.id || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('roster_events')
          .insert({
            roster_id: roster.id,
            event_name: name,
            event_date: date,
            event_time: time || null,
            sort_order: events.length,
          })
          .select()
          .single();

        if (error) throw error;

        setEvents((prev) => [
          ...prev,
          { id: data.id, roster_id: data.roster_id, name: data.event_name, date: data.event_date, time: data.event_time, sort_order: data.sort_order },
        ]);
        toast.success(`Added "${name}" event`);
      } catch (err) {
        console.error('Failed to add event:', err);
        toast.error('Failed to add event');
      }
    },
    [roster?.id, events.length]
  );

  const handleRemoveEvent = useCallback(
    async (eventId) => {
      if (!supabase) return;
      try {
        const { error } = await supabase
          .from('roster_events')
          .delete()
          .eq('id', eventId);

        if (error) throw error;

        setEvents((prev) => prev.filter((e) => e.id !== eventId));

        // Clean up assignments for this event
        setCurrentAssignments((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (key.startsWith(`${eventId}-`)) delete next[key];
          }
          return next;
        });
      } catch (err) {
        console.error('Failed to remove event:', err);
        toast.error('Failed to remove event');
      }
    },
    []
  );

  const handleBackToEditor = useCallback(() => {
    setCurrentView(VIEW.EDITOR);
  }, []);

  const handleConfirmPublish = useCallback(async (shareToken) => {
    if (!roster?.id) return;
    try {
      // Save assignments before publishing
      if (supabase) {
        const config = serializeRoleConfig(roleSlots);
        await supabase
          .from('rosters')
          .update({ signature_fields: { roleConfig: config, assignments: currentAssignments } })
          .eq('id', roster.id);
      }

      const { data, error } = await publishRoster(roster.id, shareToken);
      if (error) throw error;
      setRoster((prev) => ({
        ...prev,
        status: ROSTER_STATUS.PUBLISHED,
        published_at: data?.published_at || new Date().toISOString(),
        share_token: shareToken || data?.share_token,
      }));
    } catch (err) {
      console.error('Failed to publish roster:', err);
      toast.error('Failed to publish roster. Please try again.');
    }
  }, [roster, publishRoster, roleSlots, currentAssignments]);

  const handleBackToRosters = useCallback(() => {
    navigate('/rosters');
  }, [navigate]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-primary-500" />
        <span className="ml-3 text-surface-500">Loading roster...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {currentView !== VIEW.CREATOR && roster && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" iconLeft={ArrowLeft} onClick={handleBackToRosters}>
              Rosters
            </Button>
            <div className="h-6 w-px bg-surface-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-surface-900">{roster.title}</h1>
                <Badge
                  color={roster.status === ROSTER_STATUS.PUBLISHED ? 'success' : roster.status === ROSTER_STATUS.ARCHIVED ? 'default' : 'warning'}
                  dot
                  size="sm"
                >
                  {roster.status.charAt(0).toUpperCase() + roster.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-surface-500">{roster.team_name}</p>
            </div>
          </div>
        </div>
      )}

      {currentView === VIEW.CREATOR && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-3">
            <PenLine size={24} className="text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Create a New Roster</h1>
          <p className="text-sm text-surface-500 mt-1">Follow the steps below to set up your roster.</p>
        </div>
      )}

      {currentView === VIEW.CREATOR && (
        <RosterCreator onComplete={handleCreate} onCancel={handleCancelCreate} />
      )}

      {currentView === VIEW.EDITOR && roster && (
        <RosterGrid
          roster={roster}
          events={events}
          roles={roleSlots}
          members={members}
          teamRoles={teamRoles}
          initialAssignments={currentAssignments}
          onPreview={handlePreview}
          onPublish={handlePublish}
          onSave={handleSave}
          onDuplicateRole={handleDuplicateRole}
          onRemoveRole={handleRemoveRole}
          onAddRole={handleAddRole}
          onAddEvent={handleAddEvent}
          onRemoveEvent={handleRemoveEvent}
          readOnly={false}
        />
      )}

      {currentView === VIEW.PREVIEW && roster && (
        <RosterPreview
          roster={roster}
          events={events}
          roles={roleSlots}
          members={members}
          assignments={currentAssignments}
          onBack={handleBackToEditor}
          onPublish={() => setCurrentView(VIEW.PUBLISH)}
        />
      )}

      {currentView === VIEW.PUBLISH && roster && (
        <RosterPublish
          roster={roster}
          events={events}
          roles={roleSlots}
          members={members}
          assignments={currentAssignments}
          onBack={handleBackToEditor}
          onConfirmPublish={handleConfirmPublish}
        />
      )}
    </div>
  );
}
