import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Send,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import useRosterStore from '@/stores/rosterStore';
import { supabase } from '@/lib/supabase';
import toast, { Toaster } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function ReviewRosterPage() {
  const { reviewToken } = useParams();
  const { fetchReviewRoster, submitReview } = useRosterStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rosterData, setRosterData] = useState(null);
  const [songsByEvent, setSongsByEvent] = useState({});
  const [reviews, setReviews] = useState([]);

  // Fetch roster data
  useEffect(() => {
    if (!reviewToken) {
      setError('No review token provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchReviewRoster(reviewToken).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err || !data) {
        setError('Roster not found or the review link is invalid.');
      } else {
        setRosterData(data);
        setReviews(data.reviews || []);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [reviewToken, fetchReviewRoster]);

  // Fetch songs
  useEffect(() => {
    if (!supabase || !rosterData?.events?.length) return;
    let cancelled = false;
    const eventIds = rosterData.events.map((e) => e.id);
    supabase
      .from('event_songs')
      .select('roster_event_id, title, artist, key, link, sort_order')
      .in('roster_event_id', eventIds)
      .order('sort_order')
      .then(({ data: songRows }) => {
        if (cancelled || !songRows) return;
        const map = {};
        for (const s of songRows) {
          if (!map[s.roster_event_id]) map[s.roster_event_id] = [];
          map[s.roster_event_id].push({ title: s.title, artist: s.artist, key: s.key, link: s.link });
        }
        setSongsByEvent(map);
      });
    return () => { cancelled = true; };
  }, [rosterData]);

  // Transform data for display
  const roles = useMemo(() => {
    if (!rosterData?.roleConfig) return [];
    return rosterData.roleConfig.map((r) => r.name);
  }, [rosterData]);

  const events = useMemo(() => {
    if (!rosterData?.events) return [];
    return rosterData.events.map((e) => ({
      id: e.id,
      date: e.event_date,
      name: e.event_name,
      time: e.event_time,
      rehearsalDate: e.rehearsal_date,
      rehearsalTime: e.rehearsal_time,
    }));
  }, [rosterData]);

  const displayAssignments = useMemo(() => {
    if (!rosterData) return {};
    const { assignments, roleConfig, members, guests } = rosterData;

    const roleById = {};
    for (const r of (roleConfig || [])) {
      roleById[r.id] = r.name;
    }
    const memberById = {};
    for (const m of (members || [])) {
      memberById[m.id] = m;
      if (m.user_id) memberById[m.user_id] = m;
    }
    for (const g of (guests || [])) {
      memberById[g.id] = g;
    }

    const result = {};
    const allEvents = rosterData.events || [];
    for (const [key, value] of Object.entries(assignments || {})) {
      if (!value?.memberId) continue;
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

  const handleReviewSubmitted = useCallback((newReview) => {
    setReviews((prev) => [...prev, newReview]);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-50">
        <ReviewHeader />
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <Loader2 size={32} className="animate-spin text-primary-500" />
          <p className="text-surface-500 text-sm">Loading roster for review...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !rosterData) {
    return (
      <div className="flex min-h-screen flex-col bg-surface-50">
        <ReviewHeader />
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-4">
          <AlertCircle size={40} className="text-red-400" />
          <h2 className="text-lg font-semibold text-surface-900">Roster Not Found</h2>
          <p className="text-surface-500 text-sm max-w-sm">
            {error || 'This review link may be invalid or the roster has been removed.'}
          </p>
        </div>
      </div>
    );
  }

  const { roster, team, organization } = rosterData;
  const statusLabel = roster.status === 'published' ? 'Published' : roster.status === 'archived' ? 'Archived' : 'Draft';
  const statusColor = roster.status === 'published' ? 'success' : roster.status === 'archived' ? 'default' : 'warning';

  return (
    <div className="flex min-h-screen flex-col bg-surface-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', background: '#1e293b', color: '#f8fafc', fontSize: '14px' },
        }}
      />
      <ReviewHeader />

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Roster header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-500 text-white font-bold text-sm shrink-0">
                {(organization?.name || team?.name || 'R')
                  .split(' ')
                  .map((w) => w[0] || '')
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-surface-900 leading-tight">
                  {organization?.name || team?.name || 'Organization'}
                </h1>
                <p className="text-sm text-surface-500 mt-0.5">{team?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start">
              <Badge color={statusColor} size="md" dot>
                {statusLabel}
              </Badge>
              <Badge color="info" size="md">
                Review Mode
              </Badge>
            </div>
          </div>

          {/* Roster info bar */}
          <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-surface-200">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-surface-400" />
              <span className="text-sm font-semibold text-surface-800">{roster.title}</span>
            </div>
            <span className="text-surface-300">|</span>
            <span className="text-sm text-surface-600">
              {roster.start_date && roster.end_date
                ? `${formatDate(roster.start_date, 'MMM d')} – ${formatDate(roster.end_date, 'MMM d, yyyy')}`
                : ''}
            </span>
            <span className="text-surface-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5">
              <Users size={14} className="text-surface-400" />
              <span className="text-sm text-surface-500">
                {roles.length} roles &middot; {events.length} events
              </span>
            </div>
          </div>

          {/* Scroll hint on small screens */}
          <p className="text-xs text-surface-400 mb-2 sm:hidden">
            Scroll right to see all roles &rarr;
          </p>

          {/* Full-width roster table — always visible, no responsive hiding */}
          <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white shadow-sm mb-8">
            <table className="w-full text-sm border-collapse" style={{ minWidth: `${160 + roles.length * 160}px` }}>
              <thead>
                <tr className="border-b-2 border-surface-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide bg-surface-50 rounded-tl-lg" style={{ minWidth: '180px' }}>
                    Date
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role}
                      className="px-3 py-3 text-left text-xs font-semibold text-surface-500 uppercase tracking-wide bg-surface-50"
                      style={{ minWidth: '150px' }}
                    >
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {events.map((event, idx) => (
                  <tr
                    key={event.id}
                    className={cn(
                      'transition-colors hover:bg-primary-50/30',
                      idx % 2 === 1 && 'bg-surface-50/40'
                    )}
                  >
                    <td className="px-3 py-3">
                      <div className="font-semibold text-surface-900 whitespace-nowrap">
                        {formatDate(event.date, 'EEE, MMM d')}
                      </div>
                      <div className="text-xs text-surface-500 mt-0.5">{event.name}</div>
                      {event.time && (
                        <div className="text-xs text-surface-400">Service: {fmtTime(event.time)}</div>
                      )}
                      {(event.rehearsalDate || event.rehearsalTime) && (
                        <div className="text-xs text-amber-600 mt-0.5">
                          Rehearsal: {event.rehearsalDate ? formatDate(event.rehearsalDate, 'EEE, MMM d') + ' ' : ''}{fmtTime(event.rehearsalTime)}
                        </div>
                      )}
                      {(songsByEvent[event.id] || []).length > 0 && (
                        <div className="text-xs text-violet-600 mt-1 space-y-0.5">
                          {(songsByEvent[event.id] || []).map((s, i) => (
                            <div key={i}>
                              {s.title}{s.artist ? ` — ${s.artist}` : ''}{s.key ? ` (${s.key})` : ''}
                              {s.link && (
                                <a href={s.link} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary-500 hover:underline">
                                  link
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    {roles.map((role) => {
                      const member = displayAssignments[event.id]?.[role];
                      return (
                        <td key={role} className="px-3 py-3">
                          {member ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={member} size="sm" className="ring-0" />
                              <span className="text-sm text-surface-800 whitespace-nowrap">{member}</span>
                            </div>
                          ) : (
                            <span className="text-surface-300">&mdash;</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reviews timeline */}
          {reviews.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                <MessageSquare size={15} className="text-surface-400" />
                Reviews ({reviews.length})
              </h3>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )}

          {/* Review form */}
          <ReviewForm
            rosterId={roster.id}
            submitReview={submitReview}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-surface-400 border-t border-surface-200 bg-white">
        Powered by <span className="font-semibold text-surface-500">RosterFlow</span> &mdash; {formatDate(new Date(), 'yyyy')}
      </footer>
    </div>
  );
}

function ReviewHeader() {
  return (
    <header className="flex h-14 items-center justify-center border-b border-surface-200 bg-white shrink-0">
      <Link to="/" className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-xs font-bold text-white">
          RF
        </div>
        <span className="text-lg font-semibold text-surface-900 tracking-tight">RosterFlow</span>
      </Link>
    </header>
  );
}

function ReviewCard({ review }) {
  const statusConfig = {
    approved: { label: 'Approved', color: 'success', icon: CheckCircle2 },
    changes_requested: { label: 'Changes Requested', color: 'warning', icon: AlertTriangle },
    comment: { label: 'Comment', color: 'default', icon: MessageSquare },
  };
  const config = statusConfig[review.status] || statusConfig.comment;
  const Icon = config.icon;

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white border border-surface-200">
      <Avatar name={review.reviewer_name} size="sm" className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-surface-800">{review.reviewer_name}</span>
          <Badge color={config.color} size="sm">
            <Icon size={10} className="mr-0.5" />
            {config.label}
          </Badge>
          <span className="text-xs text-surface-400 flex items-center gap-1">
            <Clock size={10} />
            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
          </span>
        </div>
        {review.comment && (
          <p className="text-sm text-surface-600 mt-1 whitespace-pre-wrap">{review.comment}</p>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ rosterId, submitReview, onReviewSubmitted }) {
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (status) => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    setSubmitting(true);
    const { data, error } = await submitReview(rosterId, name.trim(), comment.trim(), status);
    if (error) {
      toast.error('Failed to submit review: ' + (error.message || 'Unknown error'));
    } else {
      const labels = { approved: 'approved', changes_requested: 'requested changes on', comment: 'commented on' };
      toast.success(`You ${labels[status]} this roster!`);
      setSubmitted(true);
      if (data) onReviewSubmitted?.(data);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-surface-200 bg-white p-6 text-center">
        <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
        <h3 className="text-lg font-semibold text-surface-900 mb-1">Review Submitted!</h3>
        <p className="text-sm text-surface-500">Thank you for reviewing this roster. The team admin will see your feedback.</p>
        <button
          onClick={() => { setSubmitted(false); setName(''); setComment(''); }}
          className="mt-4 text-sm text-primary-500 hover:text-primary-600 font-medium cursor-pointer"
        >
          Submit another review
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5">
      <h3 className="text-base font-semibold text-surface-900 mb-4 flex items-center gap-2">
        <Send size={16} className="text-primary-500" />
        Leave a Review
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Your Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 border border-surface-200 placeholder:text-surface-400 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 mb-1">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add any notes, feedback, or suggestions..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg bg-surface-50 border border-surface-200 placeholder:text-surface-400 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            onClick={() => handleSubmit('approved')}
            disabled={submitting || !name.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-40"
            iconLeft={CheckCircle2}
          >
            {submitting ? 'Submitting...' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSubmit('changes_requested')}
            disabled={submitting || !name.trim()}
            className="text-amber-600 border-amber-300 hover:bg-amber-50 disabled:opacity-40"
            iconLeft={AlertTriangle}
          >
            Request Changes
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSubmit('comment')}
            disabled={submitting || !name.trim()}
            className="disabled:opacity-40"
            iconLeft={MessageSquare}
          >
            Just Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
