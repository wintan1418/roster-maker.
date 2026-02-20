import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  MessageCircle,
  Download,
  Mail,
  Radio,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { toPng } from 'html-to-image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatDate, generateShareToken } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/**
 * Format a roster into a WhatsApp-friendly message with member names + phones.
 */
function formatRosterMessage({ roster, events, roles, assignments, members, songsByEvent, shareLink }) {
  const findMember = (memberId) =>
    members.find((m) => m.id === memberId || m.user_id === memberId);

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  const lines = [];
  lines.push(`*${roster.title}*`);
  lines.push(`${roster.team_name || ''} | ${formatDate(roster.start_date, 'MMM d')} - ${formatDate(roster.end_date, 'MMM d, yyyy')}`);
  lines.push('');

  for (const event of events) {
    const dateStr = formatDate(event.date, 'EEE, MMM d');
    const timeStr = event.time ? ` (${fmtTime(event.time)})` : '';
    lines.push(`\u{1F4C5} *${dateStr}* - ${event.name}${timeStr}`);

    // Rehearsal date and/or time
    if (event.rehearsalDate || event.rehearsalTime) {
      const rehDate = event.rehearsalDate ? formatDate(event.rehearsalDate, 'EEE, MMM d') + ' ' : '';
      const rehTime = event.rehearsalTime ? fmtTime(event.rehearsalTime) : '';
      lines.push(`  \u{1F550} Rehearsal: ${rehDate}${rehTime}`);
    }

    let hasAssignment = false;
    for (const role of roles) {
      const cellKey = `${event.id}-${role.id}`;
      const assignment = assignments[cellKey];
      if (!assignment?.memberId) continue;
      const member = findMember(assignment.memberId);
      if (!member) continue;
      hasAssignment = true;
      const phone = member.phone ? ` (${member.phone})` : '';
      lines.push(`  \u{1F3B5} ${role.name}: ${member.name}${phone}`);
    }
    if (!hasAssignment) {
      lines.push('  _No assignments yet_');
    }

    // Songs for this event
    const songs = (songsByEvent || {})[event.id] || [];
    if (songs.length > 0) {
      const songList = songs.map((s) => `${s.title}${s.key ? ` (${s.key})` : ''}`).join(', ');
      lines.push(`  \u{1F3B6} Songs: ${songList}`);
    }

    lines.push('');
  }

  if (shareLink) {
    lines.push(`\u{1F517} View full roster: ${shareLink}`);
  }

  return lines.join('\n');
}

/**
 * RosterPublish - Publish confirmation and success state with WhatsApp sharing.
 */
export default function RosterPublish({
  roster,
  events,
  roles = [],
  members = [],
  assignments,
  onBack,
  onConfirmPublish,
}) {
  const alreadyPublished = roster?.status === 'published';
  const existingToken = roster?.share_token;

  const [isPublished, setIsPublished] = useState(alreadyPublished);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [generateLink, setGenerateLink] = useState(true);
  const [shareLink, setShareLink] = useState(
    existingToken ? `${window.location.origin}/r/${existingToken}` : ''
  );
  const [copied, setCopied] = useState(false);
  const [whatsappCopied, setWhatsappCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [songsByEvent, setSongsByEvent] = useState({});
  const rosterImageRef = useRef(null);

  // Fetch songs for all events once on mount
  useEffect(() => {
    if (!supabase || !events?.length) return;
    const eventIds = events.map((e) => e.id);
    supabase
      .from('event_songs')
      .select('roster_event_id, title, artist, key, sort_order')
      .in('roster_event_id', eventIds)
      .order('sort_order')
      .then(({ data }) => {
        const byEvent = {};
        for (const s of (data ?? [])) {
          if (!byEvent[s.roster_event_id]) byEvent[s.roster_event_id] = [];
          byEvent[s.roster_event_id].push({ title: s.title, artist: s.artist, key: s.key });
        }
        setSongsByEvent(byEvent);
      });
  }, [events]);

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

  // WhatsApp message — rebuilt whenever songs load or share link is set
  const rosterMessage = useMemo(() => {
    if (!isPublished) return '';
    return formatRosterMessage({ roster, events, roles, assignments, members, songsByEvent, shareLink });
  }, [isPublished, roster, events, roles, assignments, members, songsByEvent, shareLink]);

  // Re-broadcast timetable to team chat (save assignments + post to chat)
  const handleRebroadcast = useCallback(async () => {
    setIsBroadcasting(true);
    try {
      await onConfirmPublish?.(existingToken || null);
      toast.success('Timetable broadcast to team chat!', { icon: '📢' });
    } catch (err) {
      toast.error('Broadcast failed: ' + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  }, [onConfirmPublish, existingToken]);

  const findMember = useCallback(
    (memberId) => members.find((m) => m.id === memberId || m.user_id === memberId) || null,
    [members]
  );

  const handleSendEmails = async (computedShareLink) => {
    if (!supabase) return;
    setIsSendingEmail(true);
    try {
      // Use already-fetched songsByEvent state; re-fetch only if empty
      let songs = songsByEvent;
      if (Object.keys(songs).length === 0 && events?.length) {
        const eventIds = events.map((e) => e.id);
        const { data: songRows } = await supabase
          .from('event_songs')
          .select('roster_event_id, title, artist, key, sort_order')
          .in('roster_event_id', eventIds)
          .order('sort_order');
        songs = {};
        for (const s of (songRows ?? [])) {
          if (!songs[s.roster_event_id]) songs[s.roster_event_id] = [];
          songs[s.roster_event_id].push({ title: s.title, artist: s.artist, key: s.key });
        }
      }

      const { data: fnData, error: fnErr } = await supabase.functions.invoke('send-roster-emails', {
        body: {
          roster: {
            title: roster.title,
            team_name: roster.team_name,
            start_date: roster.start_date,
            end_date: roster.end_date,
          },
          events: events.map((e) => ({
            id: e.id,
            name: e.name,
            date: e.date,
            time: e.time,
            rehearsal_time: e.rehearsalTime,
            rehearsal_note: e.rehearsalNote,
          })),
          roles,
          assignments,
          members: members.map((m) => ({
            id: m.id,
            user_id: m.user_id,
            name: m.name,
            email: m.email,
            phone: m.phone,
          })),
          songs_by_event: songs,
          share_link: computedShareLink || shareLink,
        },
      });

      if (fnErr) {
        // Try to read the actual error detail from the response body
        let errDetail = fnErr.message;
        try {
          const body = await fnErr.context?.json?.();
          if (body?.error) errDetail = body.error;
        } catch { /* ignore parse errors */ }
        toast.error('Email failed: ' + errDetail, { duration: 6000 });
        return;
      }

      const sentCount = fnData?.sent ?? 0;
      if (sentCount === 0) {
        const smtpErrors = (fnData?.results ?? []).filter((r) => r.status === 'error');
        if (smtpErrors.length > 0) {
          toast.error('SMTP error: ' + smtpErrors[0].error, { duration: 8000 });
        } else {
          toast.error('No emails sent — assigned members may not have email addresses on file.', { duration: 6000 });
        }
      } else {
        toast.success(`Emails sent to ${sentCount} member(s)!`, { icon: '📧' });
      }
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      toast.error('Failed to send emails. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const token = generateLink ? generateShareToken(16) : null;
      const computedShareLink = token ? `${window.location.origin}/r/${token}` : shareLink;

      // 1. Publish the roster (updates DB status + share_token)
      await onConfirmPublish?.(token);
      if (token) setShareLink(computedShareLink);

      // 2. Send emails if opted in
      if (sendEmail) {
        await handleSendEmails(computedShareLink);
      }

      setIsPublished(true);
      toast.success('Roster published successfully!');
    } catch (err) {
      console.error('Publish failed:', err);
      toast.error('Failed to publish roster. Please try again.');
    } finally {
      setIsPublishing(false);
    }
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

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(rosterMessage);
      setWhatsappCopied(true);
      toast.success('Roster message copied!');
      setTimeout(() => setWhatsappCopied(false), 2000);
    } catch {
      toast.error('Failed to copy message');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(rosterMessage)}`;
    window.open(url, '_blank');
  };

  const handleDownloadImage = async () => {
    if (!rosterImageRef.current) return;
    setIsCapturing(true);
    try {
      const dataUrl = await toPng(rosterImageRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `${roster.title.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Roster image downloaded!');
    } catch (err) {
      console.error('Failed to capture image:', err);
      toast.error('Failed to generate image');
    } finally {
      setIsCapturing(false);
    }
  };

  // Hidden roster table — always rendered for PNG/PDF capture
  const hiddenRosterImage = (
    <div className="overflow-hidden" style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <div ref={rosterImageRef} className="p-6 bg-white" style={{ width: '900px' }}>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-surface-900">{roster.title}</h2>
          <p className="text-sm text-surface-500">
            {roster.team_name} &middot;{' '}
            {formatDate(roster.start_date, 'MMM d')} - {formatDate(roster.end_date, 'MMM d, yyyy')}
          </p>
        </div>
        <table className="w-full text-sm border-collapse border border-surface-300">
          <thead>
            <tr className="bg-surface-800 text-white">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase border border-surface-300">
                Date / Event
              </th>
              {roles.map((role) => (
                <th key={role.id} className="px-3 py-2 text-center text-xs font-semibold uppercase border border-surface-300">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((event, i) => (
              <tr key={event.id} className={i % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                <td className="px-3 py-2 border border-surface-300">
                  <div className="font-semibold text-surface-900">{event.name}</div>
                  <div className="text-xs text-surface-500">{formatDate(event.date, 'EEE, MMM d')}</div>
                  {event.rehearsalTime && <div className="text-xs text-amber-600">Rehearsal: {event.rehearsalTime}</div>}
                  {event.time && <div className="text-xs text-surface-400">Service: {event.time}</div>}
                </td>
                {roles.map((role) => {
                  const cellKey = `${event.id}-${role.id}`;
                  const assignment = assignments[cellKey];
                  const member = assignment?.memberId ? findMember(assignment.memberId) : null;
                  return (
                    <td key={role.id} className="px-3 py-2 text-center border border-surface-300">
                      {member ? (
                        <span className="text-xs font-medium text-surface-800">{member.name}</span>
                      ) : (
                        <span className="text-xs text-surface-300">--</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-surface-400 text-center">
          Generated by RosterFlow
        </p>
      </div>
    </div>
  );

  // Published success state
  if (isPublished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <div className="text-center">
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
            {sendEmail && ' Personalized emails with your roster and attachments have been sent to all assigned members.'}
          </p>
        </div>

        {/* Share link */}
        {shareLink && (
          <Card className="text-left">
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

        {/* WhatsApp sharing */}
        <Card className="text-left">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-surface-900">
              Share to WhatsApp
            </span>
          </div>
          <p className="text-xs text-surface-500 mb-3">
            Send the roster with member names and phone numbers to your WhatsApp group.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={handleOpenWhatsApp}
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              iconLeft={MessageCircle}
            >
              Open WhatsApp
            </Button>
            <Button
              variant={whatsappCopied ? 'primary' : 'outline'}
              size="sm"
              iconLeft={whatsappCopied ? Check : Copy}
              onClick={handleCopyWhatsApp}
            >
              {whatsappCopied ? 'Copied' : 'Copy Message'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconLeft={isCapturing ? undefined : Download}
              loading={isCapturing}
              onClick={handleDownloadImage}
            >
              Download Image
            </Button>
          </div>
        </Card>

        {hiddenRosterImage}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={onBack}
            iconLeft={ArrowLeft}
          >
            Edit Roster
          </Button>
          <Button
            variant="outline"
            iconLeft={Radio}
            loading={isBroadcasting}
            onClick={handleRebroadcast}
          >
            Broadcast to Team
          </Button>
          <Button
            variant="outline"
            iconLeft={Mail}
            loading={isSendingEmail}
            onClick={() => handleSendEmails(shareLink)}
          >
            Re-send Emails
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
                Each assigned member receives a personalized email with their duties, the full timetable, and PNG + PDF attachments.
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

      {hiddenRosterImage}
    </div>
  );
}
