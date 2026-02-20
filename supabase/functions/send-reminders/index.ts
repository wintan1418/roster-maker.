// Supabase Edge Function: send-reminders
// Called by pg_cron every 30 minutes. Sends email + chat reminders
// 4 hours before rehearsal and 1 hour before the service.
//
// Deploy: npx supabase functions deploy send-reminders
// Secrets: GMAIL_USER, GMAIL_APP_PASSWORD, FROM_EMAIL, APP_URL

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GMAIL_USER = Deno.env.get('GMAIL_USER') ?? '';
const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? `RosterFlow <${GMAIL_USER}>`;
const APP_URL = Deno.env.get('APP_URL') ?? 'https://rosterflow-bice.vercel.app';
const SYSTEM_USER = '00000000-0000-0000-0000-000000000000';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

function fmtTime(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

function buildReminderEmail({
  memberName,
  myRole,
  event,
  reminderType,
  songs,
  shareLink,
  teamName,
}: {
  memberName: string;
  myRole: string;
  event: Record<string, string>;
  reminderType: '4h_rehearsal' | '1h_service';
  songs: Array<{ title: string; artist?: string; key?: string }>;
  shareLink: string;
  teamName: string;
}) {
  const isRehearsal = reminderType === '4h_rehearsal';
  const when = isRehearsal
    ? `Rehearsal in ~4 hours (${fmtTime(event.rehearsal_time)})`
    : `Service starts in ~1 hour (${fmtTime(event.event_time)})`;
  const icon = isRehearsal ? '🎹' : '⛪';
  const accentColor = isRehearsal ? '#d97706' : '#1d4ed8';
  const subject = isRehearsal
    ? `🎹 Rehearsal in 4 hours — ${event.event_name} · ${fmtDate(event.event_date)}`
    : `⏰ Service starts in 1 hour — ${event.event_name} · ${fmtDate(event.event_date)}`;

  const songlistHtml = songs.length > 0 ? `
    <div style="margin-top:20px;background:#faf5ff;border-radius:10px;border:1px solid #e9d5ff;padding:18px;">
      <h3 style="margin:0 0 10px;font-size:14px;color:#6d28d9;font-weight:700;">🎵 Today's Setlist</h3>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:13px;line-height:1.8;">
        ${songs.map(s => `<li><strong>${s.title}</strong>${s.artist ? ` — ${s.artist}` : ''}${s.key ? ` <span style="color:#7c3aed;font-family:monospace;font-size:11px;">(Key: ${s.key})</span>` : ''}</li>`).join('')}
      </ol>
      <p style="margin:14px 0 0;font-size:13px;color:#6d28d9;font-style:italic;">
        Please ensure you have your score and have listened to all songs before arriving. 🙏
      </p>
    </div>` : '';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <div style="background:linear-gradient(135deg,${accentColor},${isRehearsal ? '#92400e' : '#1e3a8a'});padding:32px 24px;text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">${icon}</div>
    <h1 style="margin:0;color:white;font-size:20px;font-weight:800;">${when}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${teamName} · ${event.event_name}</p>
  </div>
  <div style="padding:28px 24px;">
    <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#111827;">Hi ${memberName}! 👋</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      This is your reminder for <strong>${event.event_name}</strong> on <strong>${fmtDate(event.event_date)}</strong>.
    </p>
    <div style="background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;padding:16px;margin-bottom:16px;">
      <div style="font-size:13px;color:#374151;line-height:1.8;">
        <div>📅 <strong>Date:</strong> ${fmtDate(event.event_date)}</div>
        ${event.rehearsal_time ? `<div>🕐 <strong>Rehearsal:</strong> ${fmtTime(event.rehearsal_time)}</div>` : ''}
        ${event.event_time ? `<div>⛪ <strong>Service:</strong> ${fmtTime(event.event_time)}</div>` : ''}
        <div>🎵 <strong>Your Role:</strong> <span style="color:${accentColor};font-weight:700;">${myRole}</span></div>
        ${event.rehearsal_note ? `<div>📝 <strong>Note:</strong> ${event.rehearsal_note}</div>` : ''}
      </div>
    </div>
    ${songlistHtml}
    <p style="margin:20px 0 0;font-size:14px;color:#1f2937;line-height:1.6;">
      We're looking forward to seeing you and worshipping together! May God bless our time of ministry. 🙌
    </p>
  </div>
  <div style="padding:0 24px 28px;text-align:center;">
    ${shareLink ? `<a href="${shareLink}" style="display:inline-block;background:linear-gradient(135deg,#1a3460,#0f1f3d);color:white;text-decoration:none;padding:12px 28px;border-radius:50px;font-weight:700;font-size:14px;">View Full Roster →</a>` : ''}
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Reminder from <strong>RosterFlow</strong> · ${teamName}</p>
  </div>
</div></body></html>`;

  return { subject, html };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    const { data: events, error: evErr } = await supabase
      .from('roster_events')
      .select(`
        id, event_name, event_date, event_time, rehearsal_time, rehearsal_note,
        roster:rosters(id, title, share_token, team_id, teams(id, name))
      `)
      .eq('event_date', todayDate)
      .eq('roster.status', 'published');

    if (evErr) throw evErr;

    const remindersToSend: Array<{ event: Record<string, string>; type: '4h_rehearsal' | '1h_service' }> = [];
    const nowMs = now.getTime();

    for (const event of (events ?? [])) {
      if (!event.roster) continue;

      if (event.rehearsal_time) {
        const rehearsalMs = new Date(`${todayDate}T${event.rehearsal_time}`).getTime();
        const diff = rehearsalMs - nowMs;
        if (diff >= 3.75 * 3600 * 1000 && diff <= 4.25 * 3600 * 1000) {
          const { data: existing } = await supabase
            .from('reminder_logs')
            .select('id')
            .eq('roster_event_id', event.id)
            .eq('reminder_type', '4h_rehearsal')
            .maybeSingle();
          if (!existing) remindersToSend.push({ event, type: '4h_rehearsal' });
        }
      }

      if (event.event_time) {
        const serviceMs = new Date(`${todayDate}T${event.event_time}`).getTime();
        const diff = serviceMs - nowMs;
        if (diff >= 0.75 * 3600 * 1000 && diff <= 1.25 * 3600 * 1000) {
          const { data: existing } = await supabase
            .from('reminder_logs')
            .select('id')
            .eq('roster_event_id', event.id)
            .eq('reminder_type', '1h_service')
            .maybeSingle();
          if (!existing) remindersToSend.push({ event, type: '1h_service' });
        }
      }
    }

    const processed = [];

    for (const { event, type } of remindersToSend) {
      const roster = event.roster as Record<string, unknown>;
      const team = roster.teams as Record<string, string>;
      const teamName = team?.name || 'Team';
      const teamId = roster.team_id as string;
      const shareToken = roster.share_token as string;
      const shareLink = shareToken ? `${APP_URL}/r/${shareToken}` : '';

      const { data: assignmentRows } = await supabase
        .from('roster_assignments')
        .select(`
          id, user_id,
          team_role:team_roles(name),
          profile:profiles(full_name, email)
        `)
        .eq('roster_event_id', event.id);

      const { data: songs } = await supabase
        .from('event_songs')
        .select('title, artist, key')
        .eq('roster_event_id', event.id)
        .order('sort_order');

      const songList = songs ?? [];

      // Post to team chat
      const isRehearsal = type === '4h_rehearsal';
      let chatMsg = isRehearsal
        ? `🎹 *Rehearsal Reminder* — Starting in ~4 hours!\n📅 ${fmtDate(event.event_date)} · ${event.event_name}\n🕐 Rehearsal: ${fmtTime(event.rehearsal_time)}`
        : `⏰ *Service Reminder* — Starting in ~1 hour!\n📅 ${fmtDate(event.event_date)} · ${event.event_name}\n⛪ Service: ${fmtTime(event.event_time)}`;

      if (songList.length > 0) {
        chatMsg += `\n\n🎵 *Today's Setlist:*\n${songList.map((s, i) => `${i + 1}. ${s.title}${s.key ? ` (Key: ${s.key})` : ''}`).join('\n')}`;
      }
      chatMsg += `\n\nPlease ensure you have your score and have listened to the songs. We're looking forward to worshipping with you! 🙌🙏`;

      await supabase.from('team_messages').insert({
        team_id: teamId,
        user_id: SYSTEM_USER,
        author_name: 'RosterFlow',
        content: chatMsg,
      });

      // Send individual reminder emails via Gmail
      if (GMAIL_USER && assignmentRows) {
        for (const row of assignmentRows) {
          const profile = row.profile as Record<string, string>;
          if (!profile?.email) continue;
          const { subject, html } = buildReminderEmail({
            memberName: profile.full_name || 'Team Member',
            myRole: (row.team_role as Record<string, string>)?.name || 'Role',
            event: event as Record<string, string>,
            reminderType: type,
            songs: songList,
            shareLink,
            teamName,
          });

          try {
            await transporter.sendMail({
              from: FROM_EMAIL,
              to: profile.email,
              subject,
              html,
            });
          } catch (mailErr) {
            console.error(`Reminder email failed for ${profile.email}:`, mailErr);
          }
        }
      }

      await supabase.from('reminder_logs').insert({
        roster_event_id: event.id,
        reminder_type: type,
      });

      processed.push({ eventId: event.id, type, teamName });
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
