import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar,
  CalendarDays,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import { ROSTER_STATUS } from '@/lib/constants';

const STATUS_BADGE_MAP = {
  [ROSTER_STATUS.DRAFT]: { color: 'warning', label: 'Draft' },
  [ROSTER_STATUS.PUBLISHED]: { color: 'success', label: 'Published' },
  [ROSTER_STATUS.ARCHIVED]: { color: 'default', label: 'Archived' },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: ROSTER_STATUS.DRAFT, label: 'Draft' },
  { key: ROSTER_STATUS.PUBLISHED, label: 'Published' },
  { key: ROSTER_STATUS.ARCHIVED, label: 'Archived' },
];

export default function RosterList({ rosters = [], onCreateNew }) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first

  const filteredRosters = useMemo(() => {
    let result = [...rosters];

    // Filter
    if (activeFilter !== 'all') {
      result = result.filter((r) => r.status === activeFilter);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [rosters, activeFilter, sortOrder]);

  const handleRosterClick = (roster) => {
    navigate(`/rosters/${roster.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Filter tabs and sort */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 bg-surface-100 rounded-lg">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer',
                activeFilter === tab.key
                  ? 'bg-white text-surface-900 shadow-sm'
                  : 'text-surface-500 hover:text-surface-700'
              )}
            >
              {tab.label}
              {tab.key !== 'all' && (
                <span className="ml-1.5 text-xs text-surface-400">
                  {rosters.filter((r) =>
                    tab.key === 'all' ? true : r.status === tab.key
                  ).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg',
            'text-surface-500 hover:text-surface-700 hover:bg-surface-100',
            'transition-all duration-200 cursor-pointer'
          )}
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {/* Roster grid */}
      {filteredRosters.length === 0 && rosters.length > 0 ? (
        <EmptyState
          icon={Filter}
          title="No matching rosters"
          description={`No ${activeFilter === 'all' ? '' : activeFilter + ' '}rosters found. Try a different filter.`}
        />
      ) : filteredRosters.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No rosters yet"
          description="Create your first roster to start scheduling your team."
          action={
            <button
              onClick={onCreateNew}
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg',
                'bg-primary-600 text-white hover:bg-primary-700',
                'transition-all duration-200 cursor-pointer'
              )}
            >
              <Plus size={16} />
              Create Roster
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Create new card */}
          <button
            onClick={onCreateNew}
            className={clsx(
              'flex flex-col items-center justify-center gap-3 p-8',
              'rounded-xl border-2 border-dashed border-surface-300',
              'text-surface-400 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50/50',
              'transition-all duration-200 cursor-pointer min-h-[200px]',
              'group'
            )}
          >
            <div
              className={clsx(
                'flex items-center justify-center w-12 h-12 rounded-xl',
                'bg-surface-100 group-hover:bg-primary-100',
                'transition-colors duration-200'
              )}
            >
              <Plus size={24} className="transition-colors duration-200" />
            </div>
            <span className="text-sm font-medium">Create New Roster</span>
          </button>

          {/* Roster cards */}
          {filteredRosters.map((roster) => {
            const statusInfo = STATUS_BADGE_MAP[roster.status] || STATUS_BADGE_MAP[ROSTER_STATUS.DRAFT];
            return (
              <Card
                key={roster.id}
                hover
                className="cursor-pointer group"
                onClick={() => handleRosterClick(roster)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={clsx(
                      'flex items-center justify-center w-10 h-10 rounded-lg',
                      'bg-primary-50 group-hover:bg-primary-100',
                      'transition-colors duration-200'
                    )}
                  >
                    <Calendar size={20} className="text-primary-500" />
                  </div>
                  <Badge color={statusInfo.color} dot>
                    {statusInfo.label}
                  </Badge>
                </div>

                <h3 className="text-base font-semibold text-surface-900 mb-1 leading-tight">
                  {roster.title}
                </h3>

                <p className="text-sm text-surface-500 mb-4">
                  {roster.team_name}
                </p>

                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={13} />
                    {formatDate(roster.start_date, 'MMM d')} - {formatDate(roster.end_date, 'MMM d, yyyy')}
                  </span>
                  <span>
                    {roster.event_count} event{roster.event_count !== 1 ? 's' : ''}
                  </span>
                </div>

                {roster.published_at && (
                  <p className="mt-2 text-xs text-surface-400">
                    Published {formatDate(roster.published_at, 'MMM d, yyyy')}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
