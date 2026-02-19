import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Users, ShieldCheck, Music, Church, Layers } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { formatDate } from '@/lib/utils';

const templateConfig = {
  music: {
    label: 'Music',
    color: 'primary',
    icon: Music,
  },
  church_event: {
    label: 'Church Event',
    color: 'success',
    icon: Church,
  },
  custom: {
    label: 'Custom',
    color: 'default',
    icon: Layers,
  },
};

export default function TeamCard({ team }) {
  const {
    id,
    name,
    description,
    template_type = 'custom',
    members = [],
    roles = [],
    created_at,
  } = team;

  const config = templateConfig[template_type] || templateConfig.custom;
  const TemplateIcon = config.icon;
  const memberCount = members.length;
  const roleCount = roles.length;
  const visibleMembers = members.slice(0, 4);
  const overflowCount = memberCount - visibleMembers.length;

  return (
    <Link to={`/teams/${id}`} className="block group focus:outline-none">
      <Card
        hover
        className={clsx(
          'h-full cursor-pointer',
          'group-focus-visible:ring-2 group-focus-visible:ring-primary-500 group-focus-visible:ring-offset-2'
        )}
      >
        {/* Top row: badge + date */}
        <div className="flex items-center justify-between mb-3">
          <Badge color={config.color} size="sm">
            <TemplateIcon size={12} className="shrink-0" />
            {config.label}
          </Badge>
          {created_at && (
            <span className="text-xs text-surface-400">
              {formatDate(created_at)}
            </span>
          )}
        </div>

        {/* Team name */}
        <h3 className="text-lg font-semibold text-surface-900 mb-1 group-hover:text-primary-600 transition-colors duration-200">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-surface-500 mb-4 line-clamp-2">
            {description}
          </p>
        )}
        {!description && <div className="mb-4" />}

        {/* Bottom row: member avatars + stats */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-100">
          {/* Avatar stack */}
          <div className="flex items-center">
            {visibleMembers.length > 0 ? (
              <div className="flex -space-x-2">
                {visibleMembers.map((member) => (
                  <Avatar
                    key={member.id}
                    name={member.name}
                    src={member.avatar_url}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
                {overflowCount > 0 && (
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-surface-100 text-xs font-medium text-surface-600 ring-2 ring-white">
                    +{overflowCount}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-surface-400">No members yet</span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-surface-500">
            <span className="inline-flex items-center gap-1">
              <Users size={14} className="text-surface-400" />
              {memberCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={14} className="text-surface-400" />
              {roleCount}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
