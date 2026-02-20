// Supabase Edge Function: send-roster-emails
// Sends personalized roster emails via Brevo (Sendinblue) transactional email API.
// Deploy: npx supabase functions deploy send-roster-emails
//
// Secrets required:
//   BREVO_API_KEY   — Your Brevo API key (Account > SMTP & API > API Keys)
//
// Optional secrets:
//   FROM_EMAIL      — Sender address, e.g. "RosterFlow <noreply@yourdomain.com>"
//                     Defaults to your verified Brevo sender address
//   FROM_NAME       — Sender display name (default: "RosterFlow")
//   APP_URL         — Your app URL (default: https://rosterflow-bice.vercel.app)
//
// Set secrets:
//   npx supabase secrets set BREVO_API_KEY=xkeysib-...

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') ?? '';
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? '';
const FROM_NAME = Deno.env.get('FROM_NAME') ?? 'RosterFlow';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://rosterflow-bice.vercel.app';

interface Member { id: string; user_id: string; name: string; email?: string; phone?: string; }
interface RosterEvent { id: string; name: string; date: string; time?: string; rehearsal_time?: string; rehearsal_note?: string; }
interface Role { id: string; name: string; }
interface Song { title: string; artist?: string; key?: string; }
interface Assignment { memberId: string; manual?: boolean; }

function fmt(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtTime(t?: string) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function buildEmailHtml({
  memberName,
  myAssignments,
  roster,
  events,
  roles,
  assignments,
  members,
  songsByEvent,
  shareLink,
}: {
  memberName: string;
  myAssignments: Array<{ event: RosterEvent; role: Role }>;
  roster: Record<string, string>;
  events: RosterEvent[];
  roles: Role[];
  assignments: Record<string, Assignment>;
  members: Member[];
  songsByEvent: Record<string, Song[]>;
  shareLink: string;
}) {
  const teamName = roster.team_name || 'Your Team';
  const rosterTitle = roster.title || 'Roster';
  const dateRange = `${fmt(roster.start_date)} – ${fmt(roster.end_date)}`;

  const myRows = myAssignments.map(({ event, role }) => {
    const rTime = event.rehearsal_time ? `<br><span style="color:#d97706;font-size:12px;">🕐 Rehearsal: ${fmtTime(event.rehearsal_time)}</span>` : '';
    const sTime = event.time ? `<br><span style="color:#6b7280;font-size:12px;">⛪ Service: ${fmtTime(event.time)}</span>` : '';
    return `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:12px 16px;">
          <div style="font-weight:700;color:#111827;">${fmt(event.date)}</div>
          <div style="color:#6b7280;font-size:13px;">${event.name}${rTime}${sTime}</div>
        </td>
        <td style="padding:12px 16px;text-align:center;">
          <span style="background:#eff6ff;color:#1d4ed8;border-radius:20px;padding:4px 12px;font-size:13px;font-weight:600;">${role.name}</span>
        </td>
      </tr>`;
  }).join('');

  const timetableRows = events.map((event) => {
    const eventAssignments = Object.entries(assignments)
      .filter(([key]) => key.startsWith(event.id + '-'))
      .map(([key, val]) => {
        const roleId = key.slice(event.id.length + 1);
        const role = roles.find(r => r.id === roleId);
        const member = members.find(m => m.id === val.memberId || m.user_id === val.memberId);
        return role && member ? `${role.name}: <strong>${member.name}</strong>` : null;
      }).filter(Boolean);

    const songs = songsByEvent[event.id] || [];
    const songsHtml = songs.length > 0
      ? `<br><span style="color:#7c3aed;font-size:11px;">🎵 ${songs.map(s => `${s.title}${s.key ? ` (${s.key})` : ''}`).join(' · ')}</span>`
      : '';

    const rTime = event.rehearsal_time ? `<div style="color:#d97706;font-size:11px;">🕐 Rehearsal ${fmtTime(event.rehearsal_time)}</div>` : '';
    const sTime = event.time ? `<div style="color:#6b7280;font-size:11px;">⛪ Service ${fmtTime(event.time)}</div>` : '';

    return `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:10px 16px;vertical-align:top;min-width:130px;">
          <div style="font-weight:700;color:#111827;font-size:13px;">${fmt(event.date)}</div>
          <div style="color:#6b7280;font-size:12px;">${event.name}</div>
          ${rTime}${sTime}
        </td>
        <td style="padding:10px 16px;vertical-align:top;font-size:13px;color:#374151;">
          ${eventAssignments.join('<br>') || '<em style="color:#9ca3af;">No assignments</em>'}
          ${songsHtml}
        </td>
      </tr>`;
  }).join('');

  const allSongs = Object.entries(songsByEvent).flatMap(([eventId, songs]) => {
    const event = events.find(e => e.id === eventId);
    return songs.map(s => ({ ...s, eventName: event?.name || '' }));
  });

  const songlistHtml = allSongs.length > 0 ? `
    <div style="margin:0 24px 24px;background:#faf5ff;border-radius:12px;border:1px solid #e9d5ff;padding:20px;">
      <h3 style="margin:0 0 12px;font-size:15px;color:#6d28d9;">🎵 Full Setlist</h3>
      <table style="width:100%;border-collapse:collapse;">
        ${allSongs.map((s, i) => `
          <tr style="border-bottom:1px solid #ede9fe;">
            <td style="padding:8px 0;width:28px;color:#9ca3af;font-size:13px;font-weight:700;">${i + 1}.</td>
            <td style="padding:8px 0;">
              <div style="font-weight:600;color:#1f2937;font-size:13px;">${s.title}</div>
              ${s.artist ? `<div style="color:#6b7280;font-size:12px;">${s.artist}</div>` : ''}
            </td>
            ${s.key ? `<td style="padding:8px 0;text-align:right;"><span style="background:#ede9fe;color:#6d28d9;border-radius:8px;padding:2px 8px;font-size:11px;font-family:monospace;font-weight:700;">Key: ${s.key}</span></td>` : '<td></td>'}
          </tr>`).join('')}
      </table>
      <p style="margin:16px 0 0;font-size:13px;color:#7c3aed;font-style:italic;">
        Please ensure you have your score and have listened to all songs. We're looking forward to worshipping with you! 🙏
      </p>
    </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${rosterTitle}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

  <div style="background:linear-gradient(135deg,#1a3460 0%,#0f1f3d 100%);padding:36px 24px;text-align:center;">
    <div style="font-size:28px;margin-bottom:8px;">🎶</div>
    <h1 style="margin:0;color:#f59e0b;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${teamName}</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${rosterTitle}</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:12px;">${dateRange}</p>
  </div>

  <div style="padding:28px 24px 0;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#111827;">Hi ${memberName}! 👋</p>
    <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.6;">
      The <strong>${rosterTitle}</strong> roster has been published and you've been scheduled.
      Please review your assignments below and reach out if you have any questions.
    </p>
  </div>

  <div style="padding:24px;">
    <div style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;overflow:hidden;">
      <div style="background:#1d4ed8;padding:12px 16px;">
        <h2 style="margin:0;color:white;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
          ✅ Your Assignments
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${myRows}
      </table>
    </div>
  </div>

  <div style="padding:0 24px 24px;">
    <div style="border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <div style="background:#1f2937;padding:12px 16px;">
        <h2 style="margin:0;color:white;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
          📅 Full Timetable
        </h2>
      </div>
      <table style="width:100%;border-collapse:collapse;background:white;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;">Date & Event</th>
            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#6b7280;text-transform:uppercase;font-weight:700;">Assignments</th>
          </tr>
        </thead>
        <tbody>${timetableRows}</tbody>
      </table>
    </div>
  </div>

  ${songlistHtml}

  <div style="padding:0 24px 32px;text-align:center;">
    ${shareLink ? `<a href="${shareLink}" style="display:inline-block;background:linear-gradient(135deg,#1a3460,#0f1f3d);color:white;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:15px;letter-spacing:0.02em;">View Full Roster Online →</a>` : ''}
    <p style="margin:16px 0 0;color:#9ca3af;font-size:12px;">
      For the full interactive roster, visit <a href="${APP_URL}" style="color:#1d4ed8;">${APP_URL}</a>
    </p>
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

async function sendViaBrevo(
  toEmail: string,
  toName: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  const body: Record<string, unknown> = {
    to: [{ email: toEmail, name: toName }],
    subject,
    htmlContent: html,
    sender: {
      name: FROM_NAME,
      ...(FROM_EMAIL ? { email: FROM_EMAIL } : {}),
    },
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const msg = errBody?.message || errBody?.error || `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (!BREVO_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            'BREVO_API_KEY secret is not set. ' +
            'Go to your Brevo account → Settings → SMTP & API → API Keys → Generate a new API key. ' +
            'Then run: npx supabase secrets set BREVO_API_KEY=xkeysib-... and redeploy the function.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      roster,
      events = [],
      roles = [],
      assignments = {},
      members = [],
      songs_by_event: songsByEvent = {},
      share_link: shareLink = '',
    } = await req.json();

    // Build per-member assignment map
    const memberAssignments: Record<string, Array<{ event: RosterEvent; role: Role }>> = {};
    for (const [key, val] of Object.entries(assignments as Record<string, Assignment>)) {
      if (!val?.memberId) continue;
      const event = (events as RosterEvent[]).find(e => key.startsWith(e.id + '-'));
      if (!event) continue;
      const roleId = key.slice(event.id.length + 1);
      const role = (roles as Role[]).find(r => r.id === roleId) || { id: roleId, name: 'Role' };
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
        myAssignments,
        roster,
        events: events as RosterEvent[],
        roles: roles as Role[],
        assignments: assignments as Record<string, Assignment>,
        members: members as Member[],
        songsByEvent,
        shareLink,
      });

      const subject = `📋 ${roster.team_name || 'Team'} Roster: ${roster.title} — You're Scheduled!`;
      const { ok, error } = await sendViaBrevo(member.email, member.name, subject, html);

      if (ok) {
        results.push({ email: member.email, status: 'sent' });
      } else {
        console.error(`Failed to send to ${member.email}:`, error);
        results.push({ email: member.email, status: 'error', error });
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
