import { useState, useMemo } from 'react';
import {
  Send,
  Link2,
  Copy,
  Check,
  PartyPopper,
  ArrowLeft,
  ExternalLink,
  CalendarDays,
  Users,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatDate, generateShareToken } from '@/lib/utils';
import { getDemoRolesForTeam } from '@/lib/demoData';

/**
 * RosterPublish - Publish confirmation and success state.
 */
export default function RosterPublish({
  roster,
  events,
  assignments,
  onBack,
  onConfirmPublish,
}) {
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [generateLink, setGenerateLink] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const roles = useMemo(
    () => getDemoRolesForTeam(roster.team_id),
    [roster.team_id]
  );

  // Stats
  const stats = useMemo(() => {
    const totalCells = events.length * roles.length;
    const filledCells = Object.keys(assignments).length;
    const uniqueMembers = new Set();
    for (const value of Object.values(assignments)) {
      if (value?.memberId) uniqueMembers.add(value.memberId);
    }
    return {
      totalEvents: events.length,
      totalCells,
      filledCells,
      emptyCells: totalCells - filledCells,
      uniqueMembers: uniqueMembers.size,
    };
  }, [events, roles, assignments]);

  const handlePublish = async () => {
    setIsPublishing(true);

    // Simulate publish action
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (generateLink) {
      const token = generateShareToken(16);
      setShareLink(`${window.location.origin}/r/${token}`);
    }

    setIsPublishing(false);
    setIsPublished(true);
    onConfirmPublish?.();
    toast.success('Roster published successfully!');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // Published success state
  if (isPublished) {
    return (
      <div className="max-w-lg mx-auto text-center py-8">
        <div
          className={clsx(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            'bg-emerald-100'
          )}
        >
          <PartyPopper size={32} className="text-emerald-600" />
        </div>

        <h2 className="text-2xl font-bold text-surface-900 mb-2">
          Roster Published!
        </h2>
        <p className="text-surface-500 mb-6">
          Your roster "{roster.title}" has been published and is now live.
          {sendEmail && ' Email notifications will be sent to team members.'}
        </p>

        {shareLink && (
          <Card className="text-left mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 size={16} className="text-primary-500" />
              <span className="text-sm font-semibold text-surface-900">
                Share Link
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareLink}
                className={clsx(
                  'flex-1 px-3 py-2 text-sm rounded-lg',
                  'bg-surface-50 border border-surface-200 text-surface-700',
                  'focus:outline-none'
                )}
              />
              <Button
                variant={copied ? 'primary' : 'outline'}
                size="sm"
                iconLeft={copied ? Check : Copy}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="mt-2 text-xs text-surface-400">
              Anyone with this link can view the roster. No login required.
            </p>
          </Card>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={onBack}
            iconLeft={ArrowLeft}
          >
            Back to Rosters
          </Button>
          {shareLink && (
            <Button
              variant="primary"
              iconLeft={ExternalLink}
              onClick={() => window.open(shareLink, '_blank')}
            >
              Open Public View
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Publish confirmation
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div
          className={clsx(
            'inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4',
            'bg-primary-100'
          )}
        >
          <Send size={28} className="text-primary-600" />
        </div>
        <h2 className="text-xl font-bold text-surface-900">
          Publish Roster
        </h2>
        <p className="text-sm text-surface-500 mt-1">
          Review the summary below and confirm publication.
        </p>
      </div>

      <Card className="mb-6">
        {/* Roster summary */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-surface-900">{roster.title}</h3>
            <p className="text-sm text-surface-500 mt-0.5">{roster.team_name}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <CalendarDays size={14} className="text-surface-400" />
              {formatDate(roster.start_date, 'MMM d')} - {formatDate(roster.end_date, 'MMM d')}
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <Users size={14} className="text-surface-400" />
              {stats.uniqueMembers} member{stats.uniqueMembers !== 1 ? 's' : ''} assigned
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {stats.filledCells} / {stats.totalCells} slots filled
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <CalendarDays size={14} className="text-surface-400" />
              {stats.totalEvents} event{stats.totalEvents !== 1 ? 's' : ''}
            </div>
          </div>

          {stats.emptyCells > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-700">
                Note: {stats.emptyCells} slot{stats.emptyCells !== 1 ? 's are' : ' is'} still empty.
                You can still publish with empty slots.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-surface-200 mt-4 pt-4 space-y-3">
          <h4 className="text-sm font-semibold text-surface-700">Options</h4>

          {/* Email checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className={clsx(
                  'w-4 h-4 rounded border-surface-300 text-primary-600',
                  'focus:ring-primary-500 focus:ring-offset-0 cursor-pointer'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800 group-hover:text-surface-900">
                Send email notifications
              </p>
              <p className="text-xs text-surface-400">
                Team members will receive their assignment details via email.
              </p>
            </div>
          </label>

          {/* Share link checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center mt-0.5">
              <input
                type="checkbox"
                checked={generateLink}
                onChange={(e) => setGenerateLink(e.target.checked)}
                className={clsx(
                  'w-4 h-4 rounded border-surface-300 text-primary-600',
                  'focus:ring-primary-500 focus:ring-offset-0 cursor-pointer'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-800 group-hover:text-surface-900">
                Generate share link
              </p>
              <p className="text-xs text-surface-400">
                Create a public link so anyone can view the roster without logging in.
              </p>
            </div>
          </label>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} iconLeft={ArrowLeft}>
          Go Back
        </Button>
        <Button
          variant="primary"
          loading={isPublishing}
          onClick={handlePublish}
          iconLeft={Send}
        >
          Publish Now
        </Button>
      </div>
    </div>
  );
}
