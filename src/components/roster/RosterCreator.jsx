import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Trash2,
  Calendar,
  Users,
  Type,
  CalendarDays,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Clock,
  Music,
  Church,
  Layers,
  Mic2,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, eachDayOfInterval, getDay } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { PERIOD_TYPES, TEMPLATE_TYPES } from '@/lib/constants';
import useTeamStore from '@/stores/teamStore';
import useAuthStore from '@/stores/authStore';

const STEPS = [
  { id: 1, label: 'Team & Title' },
  { id: 2, label: 'Roles' },
  { id: 3, label: 'Date Range' },
  { id: 4, label: 'Sessions' },
];

const SESSION_TYPES = [
  { id: 'morning', label: 'Morning', icon: Sun, time: '09:00', color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 'afternoon', label: 'Afternoon', icon: Sunset, time: '14:00', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'evening', label: 'Evening', icon: Moon, time: '18:00', color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

const TEMPLATE_ICONS = {
  music: Music,
  church_event: Church,
  custom: Layers,
};

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
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
              {currentStep > step.id ? <Check size={16} strokeWidth={3} /> : step.id}
            </div>
            <span
              className={clsx(
                'mt-1.5 text-xs font-medium whitespace-nowrap',
                currentStep >= step.id ? 'text-primary-600' : 'text-surface-400'
              )}
            >
              {step.label}
            </span>
          </div>

          {index < STEPS.length - 1 && (
            <div
              className={clsx(
                'w-10 sm:w-16 h-0.5 mx-2 mt-[-1.25rem] rounded-full transition-colors duration-300',
                currentStep > step.id ? 'bg-primary-600' : 'bg-surface-200'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Quantity stepper row (shared for grouped + ungrouped roles) ───────────────

function RoleStepper({ role, onQuantityChange, onSetQuantity, onRemove, onNameChange, indent = false }) {
  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
        role.quantity > 0
          ? 'border-primary-200 bg-primary-50/50'
          : 'border-surface-200 bg-surface-50/50',
        indent && 'ml-6'
      )}
    >
      {/* Role name */}
      {role.category === 'custom' ? (
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Type role name..."
            value={role.name}
            onChange={(e) => onNameChange?.(role.id, e.target.value)}
            className={clsx(
              'w-full px-2 py-1 text-sm font-medium rounded border bg-white',
              'focus:outline-none focus:ring-1 focus:ring-primary-500',
              'border-surface-200 placeholder:text-surface-400',
              role.quantity > 0 ? 'text-surface-900' : 'text-surface-500'
            )}
            autoFocus={!role.name}
          />
          {role.quantity > 1 && role.name.trim() && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.from({ length: role.quantity }, (_, i) => (
                <span
                  key={i}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700"
                >
                  {role.name} {i + 1}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          <span className={clsx(
            'text-sm font-medium',
            role.quantity > 0 ? 'text-surface-900' : 'text-surface-400'
          )}>
            {role.name || 'Unnamed Role'}
          </span>
          {/* Numbered slots preview */}
          {role.quantity > 1 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.from({ length: role.quantity }, (_, i) => (
                <span
                  key={i}
                  className={clsx(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                    role.group ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'
                  )}
                >
                  {role.name} {i + 1}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quantity stepper — no upper cap */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onQuantityChange(role.id, -1)}
          disabled={role.quantity <= 0}
          className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer',
            role.quantity > 0
              ? 'bg-white border border-surface-300 text-surface-600 hover:bg-surface-50'
              : 'bg-surface-100 text-surface-300 cursor-not-allowed'
          )}
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          min="0"
          value={role.quantity}
          onChange={(e) => {
            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
            onSetQuantity(role.id, val);
          }}
          className={clsx(
            'w-10 text-center text-sm font-bold tabular-nums rounded-md border bg-white py-1',
            'focus:outline-none focus:ring-1 focus:ring-primary-500',
            role.quantity > 0 ? 'text-primary-600 border-primary-200' : 'text-surface-400 border-surface-200'
          )}
        />
        <button
          onClick={() => onQuantityChange(role.id, 1)}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer bg-white border border-surface-300 text-surface-600 hover:bg-surface-50"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(role.id)}
        className="p-1.5 rounded-lg text-surface-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RosterCreator({ onComplete, onCancel }) {
  const { teams, fetchTeams } = useTeamStore();
  const orgId = useAuthStore((s) => s.orgId);

  // Fetch teams if not loaded
  useEffect(() => {
    if (orgId && teams.length === 0) fetchTeams(orgId);
  }, [orgId, teams.length, fetchTeams]);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    teamId: '',
    teamName: '',
    templateType: 'music',
    title: '',
    periodType: PERIOD_TYPES.MONTHLY,
    startDate: '',
    endDate: '',
    roles: [],
    sessions: ['morning'],
    events: [],
  });
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Load template roles when template type changes
  const loadTemplateRoles = useCallback((templateType) => {
    const template = TEMPLATE_TYPES[templateType];
    if (!template) return;

    const roles = template.defaultRoles.map((r) => ({
      ...r,
      quantity: r.min_required || 1,
      id: `role-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setFormData((prev) => ({ ...prev, templateType, roles }));
    setCollapsedGroups({});
  }, []);

  // Role quantity helpers — no upper cap, user decides
  const updateRoleQuantity = useCallback((roleId, delta) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => {
        if (r.id !== roleId) return r;
        return { ...r, quantity: Math.max(0, r.quantity + delta) };
      }),
    }));
  }, []);

  const setRoleQuantity = useCallback((roleId, value) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === roleId ? { ...r, quantity: value } : r)),
    }));
  }, []);

  const removeRole = useCallback((roleId) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
    }));
  }, []);

  const addCustomRole = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: `role-${Date.now()}`,
          name: '',
          category: 'custom',
          min_required: 1,
          max_allowed: 10,
          quantity: 1,
        },
      ],
    }));
  }, []);

  const updateRoleName = useCallback((roleId, name) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => (r.id === roleId ? { ...r, name } : r)),
    }));
  }, []);

  const toggleGroupCollapse = useCallback((groupKey) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  }, []);

  // Session toggle
  const toggleSession = useCallback((sessionId) => {
    setFormData((prev) => {
      const current = prev.sessions;
      if (current.includes(sessionId)) {
        if (current.length === 1) return prev;
        return { ...prev, sessions: current.filter((s) => s !== sessionId) };
      }
      return { ...prev, sessions: [...current, sessionId] };
    });
  }, []);

  // Quick-add specific days
  const addDayOfWeek = useCallback(
    (dayIndex, dayName) => {
      if (!formData.startDate || !formData.endDate) return;

      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      const matchingDays = eachDayOfInterval({ start, end }).filter((d) => getDay(d) === dayIndex);

      const newEvents = [];
      matchingDays.forEach((day) => {
        formData.sessions.forEach((sessionId) => {
          const session = SESSION_TYPES.find((s) => s.id === sessionId);
          newEvents.push({
            id: `evt-${format(day, 'yyyy-MM-dd')}-${sessionId}`,
            name: `${dayName} ${session.label} Service`,
            date: format(day, 'yyyy-MM-dd'),
            time: session.time,
            session: sessionId,
          });
        });
      });

      setFormData((prev) => {
        const existingIds = new Set(prev.events.map((e) => e.id));
        const unique = newEvents.filter((e) => !existingIds.has(e.id));
        return {
          ...prev,
          events: [...prev.events, ...unique].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
        };
      });
    },
    [formData.startDate, formData.endDate, formData.sessions]
  );

  const addCustomEvent = useCallback(() => {
    const defaultDate = formData.startDate || format(new Date(), 'yyyy-MM-dd');
    setFormData((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: `evt-${Date.now()}`,
          name: '',
          date: defaultDate,
          time: '09:00',
          rehearsalTime: '',
          session: 'morning',
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

  // Validation
  const isStepValid = useMemo(() => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.templateType && formData.teamId;
      case 2:
        return formData.roles.filter((r) => r.quantity > 0 && r.name.trim()).length > 0;
      case 3:
        return formData.startDate && formData.endDate && formData.startDate <= formData.endDate;
      case 4:
        return formData.events.length > 0;
      default:
        return false;
    }
  }, [step, formData]);

  const totalRoleSlots = formData.roles.reduce((sum, r) => sum + r.quantity, 0);

  // Auto-generate events from date range + sessions
  const generateAllEvents = useCallback(() => {
    if (!formData.startDate || !formData.endDate) return [];

    const start = parseISO(formData.startDate);
    const end = parseISO(formData.endDate);
    const allDays = eachDayOfInterval({ start, end });
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const events = [];
    allDays.forEach((day) => {
      formData.sessions.forEach((sessionId) => {
        const session = SESSION_TYPES.find((s) => s.id === sessionId);
        const dayName = dayNames[getDay(day)];
        events.push({
          id: `evt-${format(day, 'yyyy-MM-dd')}-${sessionId}`,
          name: `${dayName} ${session.label} Service`,
          date: format(day, 'yyyy-MM-dd'),
          time: session.time,
          rehearsalTime: '',
          session: sessionId,
        });
      });
    });

    return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [formData.startDate, formData.endDate, formData.sessions]);

  const handleNext = () => {
    if (step === 3) {
      // Auto-populate events when entering Step 4
      const events = generateAllEvents();
      setFormData((prev) => ({ ...prev, events }));
      setStep(4);
    } else if (step < 4) {
      setStep(step + 1);
    } else {
      onComplete?.({
        ...formData,
        team_name: formData.teamName || formData.title,
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

  // ── Build structured role tree: category → (group | role) ─────────────────

  const roleTree = useMemo(() => {
    const tree = {};

    formData.roles.forEach((role) => {
      const cat = role.category || 'other';
      if (!tree[cat]) tree[cat] = { ungrouped: [], groups: {} };

      if (role.group) {
        if (!tree[cat].groups[role.group]) tree[cat].groups[role.group] = [];
        tree[cat].groups[role.group].push(role);
      } else {
        tree[cat].ungrouped.push(role);
      }
    });

    return tree;
  }, [formData.roles]);

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={step} />

      <Card className="overflow-hidden">
        {/* ── Step 1: Team & Title ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Name your roster and pick a template
              </h3>
              <p className="text-sm text-surface-500">
                Choose a template to pre-fill roles, or start custom.
              </p>
            </div>

            <Select
              label="Team"
              value={formData.teamId}
              onChange={(e) => {
                const team = teams.find((t) => t.id === e.target.value);
                updateField('teamId', e.target.value);
                updateField('teamName', team?.name || '');
              }}
              placeholder="Select a team..."
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>

            <Input
              label="Roster Title"
              iconLeft={Type}
              placeholder="e.g. March 2026 Sunday Worship Roster"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Template Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(TEMPLATE_TYPES).map(([key, tmpl]) => {
                  const Icon = TEMPLATE_ICONS[key] || Layers;
                  const isSelected = formData.templateType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        updateField('templateType', key);
                        loadTemplateRoles(key);
                      }}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-surface-200 hover:border-surface-300 bg-white'
                      )}
                    >
                      <div className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-primary-100' : 'bg-surface-100'
                      )}>
                        <Icon size={20} className={isSelected ? 'text-primary-600' : 'text-surface-500'} />
                      </div>
                      <span className={clsx(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-700' : 'text-surface-700'
                      )}>
                        {tmpl.label}
                      </span>
                      <span className="text-xs text-surface-400 text-center leading-tight">
                        {tmpl.defaultRoles.length} default roles
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Select
              label="Period Type"
              icon={Calendar}
              value={formData.periodType}
              onChange={(e) => updateField('periodType', e.target.value)}
            >
              <option value={PERIOD_TYPES.WEEKLY}>Weekly</option>
              <option value={PERIOD_TYPES.MONTHLY}>Monthly</option>
              <option value={PERIOD_TYPES.CUSTOM}>Custom Date Range</option>
              <option value={PERIOD_TYPES.YEARLY}>Yearly</option>
            </Select>
          </div>
        )}

        {/* ── Step 2: Roles & Quantities ───────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Configure roles and quantities
              </h3>
              <p className="text-sm text-surface-500">
                Set how many of each role you need per service. Grouped roles expand into numbered slots (e.g. Soprano 1, Soprano 2).
              </p>
            </div>

            {formData.roles.length === 0 && (
              <div className="text-center py-6 text-surface-400 border border-dashed border-surface-300 rounded-xl">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No roles defined. Add roles or go back and pick a template.</p>
              </div>
            )}

            {Object.entries(roleTree).map(([category, { ungrouped, groups }]) => (
              <div key={category}>
                {/* Category header */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge color="default" size="sm">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {/* Ungrouped roles in this category */}
                  {ungrouped.map((role) => (
                    <RoleStepper
                      key={role.id}
                      role={role}
                      onQuantityChange={updateRoleQuantity}
                      onSetQuantity={setRoleQuantity}
                      onRemove={removeRole}
                      onNameChange={updateRoleName}
                    />
                  ))}

                  {/* Grouped roles (e.g. "Backing Vocals" → Soprano, Alto, Tenor) */}
                  {Object.entries(groups).map(([groupName, groupRoles]) => {
                    const isCollapsed = collapsedGroups[`${category}-${groupName}`];
                    const groupTotal = groupRoles.reduce((sum, r) => sum + r.quantity, 0);
                    const hasActive = groupTotal > 0;

                    return (
                      <div key={groupName}>
                        {/* Group header */}
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(`${category}-${groupName}`)}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 cursor-pointer',
                            hasActive
                              ? 'border-violet-200 bg-violet-50/60'
                              : 'border-surface-200 bg-surface-50/60 hover:bg-surface-100/60'
                          )}
                        >
                          <div className={clsx(
                            'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                            hasActive ? 'bg-violet-100' : 'bg-surface-200'
                          )}>
                            <Mic2 size={14} className={hasActive ? 'text-violet-600' : 'text-surface-400'} />
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <span className={clsx(
                              'text-sm font-semibold',
                              hasActive ? 'text-violet-700' : 'text-surface-500'
                            )}>
                              {groupName}
                            </span>
                            <span className="ml-2 text-xs text-surface-400">
                              {groupRoles.length} parts
                            </span>
                          </div>
                          {groupTotal > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-700 tabular-nums">
                              {groupTotal} total
                            </span>
                          )}
                          <ChevronDown
                            size={16}
                            className={clsx(
                              'text-surface-400 transition-transform duration-200',
                              isCollapsed && '-rotate-90'
                            )}
                          />
                        </button>

                        {/* Group children */}
                        {!isCollapsed && (
                          <div className="mt-1.5 space-y-1.5">
                            {groupRoles.map((role) => (
                              <RoleStepper
                                key={role.id}
                                role={role}
                                onQuantityChange={updateRoleQuantity}
                                onSetQuantity={setRoleQuantity}
                                onRemove={removeRole}
                                onNameChange={updateRoleName}
                                indent
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Summary + add custom */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" iconLeft={Plus} onClick={addCustomRole}>
                Add Custom Role
              </Button>
              <span className="text-sm text-surface-500">
                <span className="font-semibold text-primary-600">{totalRoleSlots}</span> slots per service
              </span>
            </div>

            {/* Expanded slots preview */}
            {totalRoleSlots > 0 && (
              <div className="p-3 rounded-xl bg-surface-50 border border-surface-200">
                <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
                  Slot Preview
                </p>
                <div className="flex flex-wrap gap-1">
                  {formData.roles
                    .filter((r) => r.quantity > 0 && r.name.trim())
                    .flatMap((r) =>
                      r.quantity === 1
                        ? [{ key: r.id, label: r.name, group: r.group }]
                        : Array.from({ length: r.quantity }, (_, i) => ({
                            key: `${r.id}-${i}`,
                            label: `${r.name} ${i + 1}`,
                            group: r.group,
                          }))
                    )
                    .map((slot) => (
                      <span
                        key={slot.key}
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium',
                          slot.group
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-primary-100 text-primary-700'
                        )}
                      >
                        {slot.label}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: Date Range ───────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Set the date range
              </h3>
              <p className="text-sm text-surface-500">
                Define when this roster starts and ends.
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

            {formData.startDate && formData.endDate && formData.startDate <= formData.endDate && (
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={16} className="text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">Date Range Summary</span>
                </div>
                {(() => {
                  const start = parseISO(formData.startDate);
                  const end = parseISO(formData.endDate);
                  const days = eachDayOfInterval({ start, end });
                  const sundays = days.filter((d) => getDay(d) === 0).length;
                  const saturdays = days.filter((d) => getDay(d) === 6).length;
                  const wednesdays = days.filter((d) => getDay(d) === 3).length;
                  return (
                    <div className="grid grid-cols-2 gap-2 text-sm text-primary-700">
                      <span>{days.length} total days</span>
                      <span>{sundays} Sundays</span>
                      <span>{saturdays} Saturdays</span>
                      <span>{wednesdays} Wednesdays</span>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Session selector */}
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">
                Service Sessions
              </label>
              <p className="text-xs text-surface-400 mb-3">
                Select which sessions to include per service day.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {SESSION_TYPES.map((session) => {
                  const Icon = session.icon;
                  const isSelected = formData.sessions.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => toggleSession(session.id)}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-surface-200 hover:border-surface-300'
                      )}
                    >
                      <div className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        isSelected ? session.bg : 'bg-surface-100'
                      )}>
                        <Icon size={20} className={isSelected ? session.color : 'text-surface-400'} />
                      </div>
                      <span className={clsx(
                        'text-sm font-medium',
                        isSelected ? 'text-surface-900' : 'text-surface-500'
                      )}>
                        {session.label}
                      </span>
                      <span className="text-xs text-surface-400">{session.time}</span>
                      {isSelected && (
                        <Check size={14} className="text-primary-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review Events ─────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-surface-900 mb-1">
                Review your service events
              </h3>
              <p className="text-sm text-surface-500">
                All days in your date range have been added with your selected sessions. Remove any you don't need, or add extras.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" iconLeft={Plus} onClick={addCustomEvent}>
                Add Custom Event
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={Trash2}
                onClick={() => updateField('events', [])}
                className="text-red-500 hover:bg-red-50"
              >
                Clear All
              </Button>
            </div>

            {/* Event list */}
            {formData.events.length === 0 ? (
              <div className="text-center py-8 text-surface-400 border border-dashed border-surface-300 rounded-xl">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events added yet. Use the quick-add buttons above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {formData.events.map((event, index) => {
                  const sessionInfo = SESSION_TYPES.find((s) => s.id === event.session);
                  const SessionIcon = sessionInfo?.icon || Clock;
                  return (
                    <div
                      key={event.id}
                      className={clsx(
                        'flex items-center gap-3 p-3 rounded-xl border border-surface-200',
                        'bg-white hover:bg-surface-50 transition-colors duration-200',
                        'group'
                      )}
                    >
                      <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-primary-50 text-primary-600 text-xs font-bold">
                        {index + 1}
                      </span>

                      <div className={clsx(
                        'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
                        sessionInfo?.bg || 'bg-surface-100'
                      )}>
                        <SessionIcon size={14} className={sessionInfo?.color || 'text-surface-400'} />
                      </div>

                      <input
                        type="text"
                        value={event.name}
                        onChange={(e) => updateEvent(event.id, 'name', e.target.value)}
                        placeholder="Event name..."
                        className="flex-1 min-w-0 px-2 py-1 text-sm rounded border-0 bg-transparent text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:bg-white"
                      />

                      <input
                        type="date"
                        value={event.date}
                        onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                        min={formData.startDate}
                        max={formData.endDate}
                        className="w-36 px-2 py-1 text-sm rounded border border-surface-200 text-surface-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />

                      <select
                        value={event.session}
                        onChange={(e) => {
                          const newSession = SESSION_TYPES.find((s) => s.id === e.target.value);
                          updateEvent(event.id, 'session', e.target.value);
                          if (newSession) updateEvent(event.id, 'time', newSession.time);
                        }}
                        className="w-28 px-2 py-1 text-sm rounded border border-surface-200 text-surface-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                      >
                        {SESSION_TYPES.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-amber-500 font-semibold whitespace-nowrap">🕐 Rehearsal</span>
                        <input
                          type="time"
                          value={event.rehearsalTime || ''}
                          onChange={(e) => updateEvent(event.id, 'rehearsalTime', e.target.value)}
                          className="w-28 px-2 py-1 text-sm rounded border border-amber-200 text-amber-700 bg-amber-50 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </div>

                      <button
                        onClick={() => removeEvent(event.id)}
                        className="p-1 rounded text-surface-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {formData.events.length > 0 && (
              <div className="flex items-center justify-between text-xs text-surface-500 pt-1">
                <span>
                  {formData.events.length} event{formData.events.length !== 1 ? 's' : ''} &middot;{' '}
                  {totalRoleSlots} roles per event &middot;{' '}
                  <span className="font-semibold text-primary-600">
                    {formData.events.length * totalRoleSlots} total slots
                  </span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <Card.Footer>
          <Button variant="ghost" onClick={handleBack} iconLeft={ChevronLeft}>
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepValid}
            iconRight={step < 4 ? ChevronRight : undefined}
            iconLeft={step === 4 ? Sparkles : undefined}
          >
            {step === 4 ? 'Create Roster' : 'Next'}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
}
