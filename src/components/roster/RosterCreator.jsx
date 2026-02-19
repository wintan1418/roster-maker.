import { useState, useCallback, useMemo } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Users,
  Type,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import { DEMO_TEAMS } from '@/lib/demoData';
import { PERIOD_TYPES } from '@/lib/constants';

const STEPS = [
  { id: 1, label: 'Team & Title' },
  { id: 2, label: 'Date Range' },
  { id: 3, label: 'Events' },
];

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={clsx(
                'flex items-center justify-center w-9 h-9 rounded-full border-2 font-semibold text-sm',
                'transition-all duration-300',
                currentStep > step.id
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : currentStep === step.id
                    ? 'bg-white border-primary-600 text-primary-600'
                    : 'bg-white border-surface-300 text-surface-400'
              )}
            >
              {currentStep > step.id ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                step.id
              )}
            </div>
            <span
              className={clsx(
                'mt-1.5 text-xs font-medium',
                currentStep >= step.id ? 'text-primary-600' : 'text-surface-400'
              )}
            >
              {step.label}
            </span>
          </div>

          {/* Connecting line */}
          {index < STEPS.length - 1 && (
            <div
              className={clsx(
                'w-16 sm:w-24 h-0.5 mx-2 mt-[-1.25rem] rounded-full transition-colors duration-300',
                currentStep > step.id ? 'bg-primary-600' : 'bg-surface-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RosterCreator({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    teamId: '',
    title: '',
    periodType: PERIOD_TYPES.MONTHLY,
    startDate: '',
    endDate: '',
    events: [],
  });

  const selectedTeam = useMemo(
    () => DEMO_TEAMS.find((t) => t.id === formData.teamId),
    [formData.teamId]
  );

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Validation per step
  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        return formData.teamId && formData.title.trim();
      case 2:
        return formData.startDate && formData.endDate && formData.startDate <= formData.endDate;
      case 3:
        return formData.events.length > 0;
      default:
        return false;
    }
  }, [step, formData]);

  // Quick-add helpers
  const addDayOfWeek = useCallback(
    (dayIndex, dayName) => {
      if (!formData.startDate || !formData.endDate) return;

      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      const allDays = eachDayOfInterval({ start, end });
      const matchingDays = allDays.filter((d) => getDay(d) === dayIndex);

      const newEvents = matchingDays.map((d, i) => ({
        id: `new-${Date.now()}-${i}`,
        name: `${dayName} Service`,
        date: format(d, 'yyyy-MM-dd'),
        time: '09:00',
      }));

      // Avoid duplicates on same date
      setFormData((prev) => {
        const existingDates = new Set(prev.events.map((e) => e.date));
        const uniqueNewEvents = newEvents.filter((e) => !existingDates.has(e.date));
        return {
          ...prev,
          events: [...prev.events, ...uniqueNewEvents].sort(
            (a, b) => a.date.localeCompare(b.date)
          ),
        };
      });
    },
    [formData.startDate, formData.endDate]
  );

  const addCustomEvent = useCallback(() => {
    const defaultDate = formData.startDate || format(new Date(), 'yyyy-MM-dd');
    setFormData((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: `new-${Date.now()}`,
          name: '',
          date: defaultDate,
          time: '',
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, [formData.startDate]);

  const updateEvent = useCallback((eventId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events
        .map((e) => (e.id === eventId ? { ...e, [field]: value } : e))
        .sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }, []);

  const removeEvent = useCallback((eventId) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== eventId),
    }));
  }, []);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Create the roster
      onComplete?.({
        ...formData,
        team_name: selectedTeam?.name || '',
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onCancel?.();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      <Card className="overflow-hidden">
        {/* Step 1: Team & Title */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Choose a team and name your roster
              </h3>
              <p className="text-sm text-surface-500">
                Select which team this roster is for and give it a descriptive title.
              </p>
            </div>

            <Select
              label="Team"
              icon={Users}
              placeholder="Select a team..."
              value={formData.teamId}
              onChange={(e) => updateField('teamId', e.target.value)}
            >
              {DEMO_TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>

            <Input
              label="Roster Title"
              iconLeft={Type}
              placeholder="e.g. March 2026 Music Roster"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
            />

            <Select
              label="Period Type"
              icon={Calendar}
              value={formData.periodType}
              onChange={(e) => updateField('periodType', e.target.value)}
            >
              <option value={PERIOD_TYPES.WEEKLY}>Weekly</option>
              <option value={PERIOD_TYPES.MONTHLY}>Monthly</option>
              <option value={PERIOD_TYPES.CUSTOM}>Custom</option>
              <option value={PERIOD_TYPES.YEARLY}>Yearly</option>
            </Select>
          </div>
        )}

        {/* Step 2: Date Range */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Set the date range
              </h3>
              <p className="text-sm text-surface-500">
                Define when this roster starts and ends. Events will be added within this range.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                iconLeft={CalendarDays}
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                iconLeft={CalendarDays}
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                min={formData.startDate}
              />
            </div>

            {formData.startDate && formData.endDate && (
              <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                <p className="text-sm text-primary-700">
                  <CalendarDays size={14} className="inline mr-1.5 -mt-0.5" />
                  {(() => {
                    const start = parseISO(formData.startDate);
                    const end = parseISO(formData.endDate);
                    const days = eachDayOfInterval({ start, end }).length;
                    const sundays = eachDayOfInterval({ start, end }).filter(
                      (d) => getDay(d) === 0
                    ).length;
                    return `${days} day${days !== 1 ? 's' : ''} selected. ${sundays} Sunday${sundays !== 1 ? 's' : ''} in range.`;
                  })()}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Events */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Add events to your roster
              </h3>
              <p className="text-sm text-surface-500">
                Add the events that need to be scheduled. Use quick-add buttons or add them manually.
              </p>
            </div>

            {/* Quick-add buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                iconLeft={Sparkles}
                onClick={() => addDayOfWeek(0, 'Sunday')}
              >
                Add All Sundays
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconLeft={Sparkles}
                onClick={() => addDayOfWeek(3, 'Wednesday')}
              >
                Add All Wednesdays
              </Button>
              <Button
                variant="outline"
                size="sm"
                iconLeft={Sparkles}
                onClick={() => addDayOfWeek(5, 'Saturday')}
              >
                Add All Saturdays
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={Plus}
                onClick={addCustomEvent}
              >
                Add Custom
              </Button>
            </div>

            {/* Event list */}
            {formData.events.length === 0 ? (
              <div className="text-center py-8 text-surface-400">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events added yet. Use the buttons above to get started.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {formData.events.map((event, index) => (
                  <div
                    key={event.id}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-lg border border-surface-200',
                      'bg-white hover:bg-surface-50 transition-colors duration-200',
                      'group'
                    )}
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-semibold">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={event.name}
                      onChange={(e) => updateEvent(event.id, 'name', e.target.value)}
                      placeholder="Event name..."
                      className={clsx(
                        'flex-1 min-w-0 px-2 py-1 text-sm rounded border-0 bg-transparent',
                        'text-surface-900 placeholder:text-surface-400',
                        'focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white'
                      )}
                    />

                    <input
                      type="date"
                      value={event.date}
                      onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                      min={formData.startDate}
                      max={formData.endDate}
                      className={clsx(
                        'w-36 px-2 py-1 text-sm rounded border border-surface-200',
                        'text-surface-700 bg-white',
                        'focus:outline-none focus:ring-1 focus:ring-primary-500'
                      )}
                    />

                    <input
                      type="time"
                      value={event.time}
                      onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                      className={clsx(
                        'w-24 px-2 py-1 text-sm rounded border border-surface-200',
                        'text-surface-700 bg-white',
                        'focus:outline-none focus:ring-1 focus:ring-primary-500'
                      )}
                    />

                    <button
                      onClick={() => removeEvent(event.id)}
                      className={clsx(
                        'p-1 rounded text-surface-300 hover:text-red-500 hover:bg-red-50',
                        'opacity-0 group-hover:opacity-100 transition-all duration-200',
                        'cursor-pointer'
                      )}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.events.length > 0 && (
              <p className="text-xs text-surface-400">
                {formData.events.length} event{formData.events.length !== 1 ? 's' : ''} added
              </p>
            )}
          </div>
        )}

        {/* Footer with navigation */}
        <Card.Footer>
          <Button variant="ghost" onClick={handleBack} iconLeft={ChevronLeft}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid}
            iconRight={step < 3 ? ChevronRight : undefined}
            iconLeft={step === 3 ? Sparkles : undefined}
          >
            {step === 3 ? 'Create Roster' : 'Next'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
