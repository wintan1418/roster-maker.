import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PenLine,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import RosterCreator from '@/components/roster/RosterCreator';
import RosterGrid from '@/components/roster/RosterGrid';
import RosterPreview from '@/components/roster/RosterPreview';
import RosterPublish from '@/components/roster/RosterPublish';
import {
  DEMO_ROSTERS,
  DEMO_EVENTS,
  DEMO_ASSIGNMENTS,
} from '@/lib/demoData';
import { ROSTER_STATUS } from '@/lib/constants';

// Views within the editor page
const VIEW = {
  CREATOR: 'creator',
  EDITOR: 'editor',
  PREVIEW: 'preview',
  PUBLISH: 'publish',
};

export default function RosterEditorPage() {
  const { rosterId } = useParams();
  const navigate = useNavigate();
  const isNew = !rosterId;

  // Load existing roster data or start fresh
  const existingRoster = useMemo(
    () => DEMO_ROSTERS.find((r) => r.id === rosterId),
    [rosterId]
  );

  const existingEvents = useMemo(
    () => (rosterId ? DEMO_EVENTS[rosterId] || [] : []),
    [rosterId]
  );

  const existingAssignments = useMemo(
    () => (rosterId ? DEMO_ASSIGNMENTS[rosterId] || {} : {}),
    [rosterId]
  );

  // Current view state
  const [currentView, setCurrentView] = useState(
    isNew ? VIEW.CREATOR : VIEW.EDITOR
  );

  // Roster data (set after creation or loaded from existing)
  const [roster, setRoster] = useState(existingRoster || null);
  const [events, setEvents] = useState(existingEvents);
  const [currentAssignments, setCurrentAssignments] = useState(existingAssignments);

  // Handle roster creation from wizard
  const handleCreate = useCallback(
    (formData) => {
      const newRoster = {
        id: `roster-new-${Date.now()}`,
        title: formData.title,
        team_id: formData.teamId,
        team_name: formData.team_name,
        status: ROSTER_STATUS.DRAFT,
        period_type: formData.periodType,
        start_date: formData.startDate,
        end_date: formData.endDate,
        created_at: new Date().toISOString(),
        published_at: null,
        event_count: formData.events.length,
      };

      setRoster(newRoster);
      setEvents(formData.events);
      setCurrentAssignments({});
      setCurrentView(VIEW.EDITOR);

      toast.success('Roster created! Start assigning members.');
    },
    []
  );

  const handleCancelCreate = useCallback(() => {
    navigate('/rosters');
  }, [navigate]);

  // Preview and publish handlers
  const handlePreview = useCallback(
    (assignments) => {
      setCurrentAssignments(assignments);
      setCurrentView(VIEW.PREVIEW);
    },
    []
  );

  const handlePublish = useCallback(
    (assignments) => {
      setCurrentAssignments(assignments);
      setCurrentView(VIEW.PUBLISH);
    },
    []
  );

  const handleSave = useCallback((assignments) => {
    setCurrentAssignments(assignments);
  }, []);

  const handleBackToEditor = useCallback(() => {
    setCurrentView(VIEW.EDITOR);
  }, []);

  const handleConfirmPublish = useCallback(() => {
    if (roster) {
      setRoster((prev) => ({
        ...prev,
        status: ROSTER_STATUS.PUBLISHED,
        published_at: new Date().toISOString(),
      }));
    }
  }, [roster]);

  const handleBackToRosters = useCallback(() => {
    navigate('/rosters');
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      {currentView !== VIEW.CREATOR && roster && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              iconLeft={ArrowLeft}
              onClick={handleBackToRosters}
            >
              Rosters
            </Button>
            <div className="h-6 w-px bg-surface-200" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-surface-900">
                  {roster.title}
                </h1>
                <Badge
                  color={
                    roster.status === ROSTER_STATUS.PUBLISHED
                      ? 'success'
                      : roster.status === ROSTER_STATUS.ARCHIVED
                        ? 'default'
                        : 'warning'
                  }
                  dot
                  size="sm"
                >
                  {roster.status.charAt(0).toUpperCase() + roster.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs text-surface-500">
                {roster.team_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Creator wizard header */}
      {currentView === VIEW.CREATOR && (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-100 mb-3">
            <PenLine size={24} className="text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-surface-900">
            Create a New Roster
          </h1>
          <p className="text-sm text-surface-500 mt-1">
            Follow the steps below to set up your roster.
          </p>
        </div>
      )}

      {/* View content */}
      {currentView === VIEW.CREATOR && (
        <RosterCreator
          onComplete={handleCreate}
          onCancel={handleCancelCreate}
        />
      )}

      {currentView === VIEW.EDITOR && roster && (
        <RosterGrid
          roster={roster}
          events={events}
          initialAssignments={currentAssignments}
          onPreview={handlePreview}
          onPublish={handlePublish}
          onSave={handleSave}
          readOnly={roster.status === ROSTER_STATUS.PUBLISHED}
        />
      )}

      {currentView === VIEW.PREVIEW && roster && (
        <RosterPreview
          roster={roster}
          events={events}
          assignments={currentAssignments}
          onBack={handleBackToEditor}
          onPublish={() => setCurrentView(VIEW.PUBLISH)}
        />
      )}

      {currentView === VIEW.PUBLISH && roster && (
        <RosterPublish
          roster={roster}
          events={events}
          assignments={currentAssignments}
          onBack={handleBackToEditor}
          onConfirmPublish={handleConfirmPublish}
        />
      )}
    </div>
  );
}
