// Supabase Edge Function: send-roster-emails
// Sends personalized roster emails via Brevo SMTP relay.
// Deploy: npx supabase functions deploy send-roster-emails
//
// Secrets required (set in Supabase Dashboard → Project Settings → Edge Functions → Secrets):
//   SMTP_USERNAME   — your Brevo SMTP username  (e.g. a1f043001@smtp-brevo.com)
//   SMTP_PASSWORD   — your Brevo SMTP password  (e.g. xsmtpsib-...)
//   FROM_EMAIL      — sender address visible to recipients (e.g. noreply@lvhs.edu.ng)
//
// Optional:
//   FROM_NAME       — display name (default: "RosterFlow")
//   APP_URL         — your app URL (default: https://rosterflow-bice.vercel.app)

import nodemailer from 'npm:nodemailer@6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') ?? '';
const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') ?? '';
const FROM_EMAIL    = Deno.env.get('FROM_EMAIL')    ?? SMTP_USERNAME;
const FROM_NAME     = Deno.env.get('FROM_NAME')     ?? 'RosterFlow';
const APP_URL       = Deno.env.get('APP_URL')       ?? 'https://rosterflow-bice.vercel.app';

interface Member   { id: string; user_id: string; name: string; email?: string; phone?: string; }
interface RosterEvent { id: string; name: string; date: string; time?: string; rehearsal_time?: string; }
interface Role     { id: string; name: string; }
interface Song     { title: string; artist?: string; key?: string; }
interface Assignment { memberId: string; manual?: boolean; }

function fmt(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function fmtTime(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function buildEmailHtml({
  memberName, memberEmail, myAssignments, roster, events, roles, assignments, members, songsByEvent, shareLink,
}: {
  memberName: string;
  memberEmail: string;
  myAssignments: Array<{ event: RosterEvent; role: Role }>;
  roster: Record<string, string>;
  events: RosterEvent[];
  roles: Role[];
  assignments: Record<string, Assignment>;
  members: Member[];
  songsByEvent: Record<string, Song[]>;
  shareLink: string;
}) {
  const teamName    = roster.team_name || 'Your Team';
  const rosterTitle = roster.title     || 'Roster';
  const dateRange   = `${fmt(roster.start_date)} – ${fmt(roster.end_date)}`;

  const myRows = myAssignments.map(({ event, role }) => {
    const rTime = event.rehearsal_time
      ? `<br><span style="color:#d97706;font-size:12px;">🕐 Rehearsal: ${fmtTime(event.rehearsal_time)}</span>` : '';
    const sTime = event.time
      ? `<br><span style="color:#6b7280;font-size:12px;">⛪ Service: ${fmtTime(event.time)}</span>` : '';
    return `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:12px 16px;">
        <div style="font-weight:700;color:#111827;">${fmt(event.date)}</div>
        <div style="color:#6b7280;font-size:13px;">${event.name}${rTime}${sTime}</div>
      </td>
      <td style="padding:12px 16px;text-align:center;">
        <span style="background:#eff6ff;color:#1d4ed8;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600;">${role.name}</span>
      </td></tr>`;
  }).join('');

  const timetableRows = events.map((event) => {
    const cols = Object.entries(assignments)
      .filter(([k]) => k.startsWith(event.id + '-'))
      .map(([k, val]) => {
        const roleId = k.slice(event.id.length + 1);
        const role   = roles.find(r => r.id === roleId);
        const member = members.find(m => m.id === val.memberId || m.user_id === val.memberId);
        return role && member ? `${role.name}: <strong>${member.name}</strong>` : null;
      }).filter(Boolean);

    const songs = songsByEvent[event.id] || [];
    const songsHtml = songs.length > 0
      ? `<br><span style="color:#7c3aed;font-size:11px;">🎵 ${songs.map(s => `${s.title}${s.key ? ` (${s.key})` : ''}`).join(' · ')}</span>`
      : '';

    return `<tr style="border-bottom:1px solid #f3f4f6;">
      <td style="padding:10px 16px;vertical-align:top;min-width:130px;">
        <div style="font-weight:700;color:#111827;font-size:13px;">${fmt(event.date)}</div>
        <div style="color:#6b7280;font-size:12px;">${event.name}</div>
        ${event.rehearsal_time ? `<div style="color:#d97706;font-size:11px;">🕐 Rehearsal ${fmtTime(event.rehearsal_time)}</div>` : ''}
        ${event.time ? `<div style="color:#6b7280;font-size:11px;">⛪ Service ${fmtTime(event.time)}</div>` : ''}
      </td>
      <td style="padding:10px 16px;vertical-align:top;font-size:13px;color:#374151;">
        ${cols.join('<br>') || '<em style="color:#9ca3af;">No assignments</em>'}${songsHtml}
      </td></tr>`;
  }).join('');

  const allSongs = Object.entries(songsByEvent).flatMap(([eid, songs]) => {
    const ev = events.find(e => e.id === eid);
    return songs.map(s => ({ ...s, eventName: ev?.name || '' }));
  });

  const songlistHtml = allSongs.length > 0 ? `
    <div style="margin:0 24px 24px;background:#faf5ff;border-radius:12px;border:1px solid #e9d5ff;padding:20px;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#6d28d9;">🎵 Full Setlist</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${allSongs.map((s, i) => `<tr style="border-bottom:1px solid #ede9fe;">
          <td style="padding:8px 0;width:28px;color:#9ca3af;font-size:13px;font-weight:700;">${i + 1}.</td>
          <td style="padding:8px 0;">
            <div style="font-weight:600;color:#1f2937;font-size:13px;">${s.title}</div>
            ${s.artist ? `<div style="color:#6b7280;font-size:12px;">${s.artist}</div>` : ''}
          </td>
          ${s.key ? `<td style="padding:8px 0;text-align:right;"><span style="background:#ede9fe;color:#6d28d9;border-radius:8px;padding:2px 8px;font-size:11px;font-family:monospace;font-weight:700;">Key: ${s.key}</span></td>` : '<td></td>'}
        </tr>`).join('')}
      </table>
    </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>${rosterTitle}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#1a3460,#0f1f3d);padding:36px 24px;text-align:center;">
    <div style="font-size:28px;margin-bottom:8px;">🎶</div>
    <h1 style="margin:0;color:#f59e0b;font-size:22px;font-weight:800;">${teamName}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.75);font-size:14px;">${rosterTitle}</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,.5);font-size:12px;">${dateRange}</p>
  </div>
  <div style="padding:28px 24px 0;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Hi ${memberName}! 👋</p>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
      The <strong>${rosterTitle}</strong> roster has been published and you've been scheduled.
      Please review your assignments below.
    </p>
  </div>
  <div style="padding:24px;">
    <div style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;overflow:hidden;">
      <div style="background:#1d4ed8;padding:12px 16px;">
        <h2 style="margin:0;color:white;font-size:14px;font-weight:700;text-transform:uppercase;">✅ Your Assignments</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;">${myRows}</table>
    </div>
  </div>
  <div style="padding:0 24px 24px;">
    <div style="border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background:#1f2937;padding:12px 16px;">
        <h2 style="margin:0;color:white;font-size:14px;font-weight:700;text-transform:uppercase;">📅 Full Timetable</h2>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;">Date & Event</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;">Assignments</th>
        </tr></thead>
        <tbody>${timetableRows}</tbody>
      </table>
    </div>
  </div>
  ${songlistHtml}
  <div style="padding:0 24px 32px;text-align:center;">
    ${shareLink ? `
      <a href="${shareLink}/me?email=${encodeURIComponent(memberEmail)}"
         style="display:inline-block;background:linear-gradient(135deg,#1a3460,#0f1f3d);color:white;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;">
        View My Schedule →
      </a>
      <br>
      <a href="${shareLink}" style="display:inline-block;margin-top:12px;color:#6b7280;font-size:13px;text-decoration:none;">
        View Full Team Roster
      </a>
    ` : ''}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">Visit <a href="${APP_URL}" style="color:#1d4ed8;">${APP_URL}</a></p>
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 24px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Sent by <strong style="color:#374151;">RosterFlow</strong> · ${teamName}<br>
      <em>To stop receiving these emails, contact your team admin.</em>
    </p>
  </div>
</div>
</body></html>`;
}

// Create transporter once (reused across requests in warm instances)
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: { user: SMTP_USERNAME, pass: SMTP_PASSWORD },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!SMTP_USERNAME || !SMTP_PASSWORD) {
      return new Response(
        JSON.stringify({
          error:
            'SMTP_USERNAME and SMTP_PASSWORD secrets are not set. ' +
            'Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets and add them.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      roster,
      events        = [],
      roles         = [],
      assignments   = {},
      members       = [],
      songs_by_event: songsByEvent = {},
      share_link:   shareLink = '',
    } = await req.json();

    // Build per-member assignment map
    const memberAssignments: Record<string, Array<{ event: RosterEvent; role: Role }>> = {};
    for (const [key, val] of Object.entries(assignments as Record<string, Assignment>)) {
      if (!val?.memberId) continue;
      const event = (events as RosterEvent[]).find(e => key.startsWith(e.id + '-'));
      if (!event) continue;
      const roleId = key.slice(event.id.length + 1);
      const role   = (roles as Role[]).find(r => r.id === roleId) || { id: roleId, name: 'Role' };
      if (!memberAssignments[val.memberId]) memberAssignments[val.memberId] = [];
      memberAssignments[val.memberId].push({ event, role });
    }

    const results = [];

    for (const member of (members as Member[])) {
      if (!member.email) continue;
      const myAssignments = memberAssignments[member.id] || memberAssignments[member.user_id] || [];
      if (myAssignments.length === 0) continue;

      const html = buildEmailHtml({
        memberName: member.name,
        memberEmail: member.email,
        myAssignments,
        roster,
        events:      events      as RosterEvent[],
        roles:       roles       as Role[],
        assignments: assignments as Record<string, Assignment>,
        members:     members     as Member[],
        songsByEvent,
        shareLink,
      });

      try {
        await transporter.sendMail({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      member.email,
          subject: `📋 ${roster.team_name || 'Team'} Roster: ${roster.title} — You're Scheduled!`,
          html,
        });
        results.push({ email: member.email, status: 'sent' });
      } catch (mailErr) {
        console.error(`Failed to send to ${member.email}:`, mailErr);
        results.push({ email: member.email, status: 'error', error: (mailErr as Error).message });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;
    return new Response(
      JSON.stringify({ success: true, sent: sentCount, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
