// Supabase Edge Function: send-availability-reminder
// Sends personalized availability reminder emails to non-responders via Brevo SMTP.
// Deploy: npx supabase functions deploy send-availability-reminder
//
// Secrets required (same as send-roster-emails):
//   SMTP_USERNAME, SMTP_PASSWORD, FROM_EMAIL
// Optional: FROM_NAME, APP_URL

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

interface NonResponder {
  name: string;
  email: string;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildReminderHtml({
  memberName,
  rosterTitle,
  teamName,
  dateRange,
  availabilityLink,
}: {
  memberName: string;
  rosterTitle: string;
  teamName: string;
  dateRange: string;
  availabilityLink: string;
}) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<title>Availability Reminder</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
  <div style="background:linear-gradient(135deg,#d97706,#92400e);padding:36px 24px;text-align:center;">
    <div style="font-size:36px;margin-bottom:8px;">🔔</div>
    <h1 style="margin:0;color:white;font-size:22px;font-weight:800;">Availability Reminder</h1>
    <p style="margin:6px 0 0;color:rgba(255,255,255,.8);font-size:14px;">${teamName}</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,.55);font-size:12px;">${dateRange}</p>
  </div>
  <div style="padding:28px 24px;">
    <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">Hi ${memberName}! 👋</p>
    <p style="margin:0 0 16px;color:#6b7280;font-size:14px;line-height:1.6;">
      Your team admin is preparing the <strong>${rosterTitle}</strong> roster and needs to know your availability.
    </p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
      Please take a moment to mark which sessions you can attend. It only takes a minute!
    </p>
    <div style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#92400e;">📋 ${rosterTitle}</p>
      <p style="margin:0;font-size:13px;color:#78716c;">${dateRange}</p>
    </div>
    <div style="text-align:center;">
      <a href="${availabilityLink}"
         style="display:inline-block;background:linear-gradient(135deg,#d97706,#b45309);color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;font-size:15px;">
        Mark My Availability →
      </a>
    </div>
    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.5;">
      Or copy this link into your browser:<br>
      <a href="${availabilityLink}" style="color:#d97706;word-break:break-all;">${availabilityLink}</a>
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
          error: 'SMTP secrets not configured. Set SMTP_USERNAME and SMTP_PASSWORD in Edge Function Secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      roster_title   = 'Roster',
      team_name      = 'Your Team',
      start_date     = '',
      end_date       = '',
      availability_link = '',
      non_responders = [],
    } = await req.json();

    const dateRange = start_date && end_date
      ? `${fmtDate(start_date)} – ${fmtDate(end_date)}`
      : '';

    const results: Array<{ email: string; status: string; error?: string }> = [];

    for (const member of (non_responders as NonResponder[])) {
      if (!member.email) continue;

      const html = buildReminderHtml({
        memberName: member.name || 'Team Member',
        rosterTitle: roster_title,
        teamName: team_name,
        dateRange,
        availabilityLink: availability_link,
      });

      try {
        await transporter.sendMail({
          from:    `${FROM_NAME} <${FROM_EMAIL}>`,
          to:      member.email,
          subject: `🔔 Availability Reminder: ${roster_title} — Please respond`,
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
