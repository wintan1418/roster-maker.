// Supabase Edge Function: bulk-invite
// Creates auth users and sends invite emails using Supabase's built-in email system.
// Deploy: npx supabase functions deploy bulk-invite

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { members, team_id, org_id, role_ids = [] } = await req.json();

        if (!members || !Array.isArray(members) || members.length === 0) {
            return new Response(
                JSON.stringify({ error: 'No members provided' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create admin client with service_role key for user management
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const results = [];

        for (const member of members) {
            try {
                const email = member.email?.trim().toLowerCase();
                if (!email) {
                    results.push({ email: '', status: 'skipped', reason: 'No email' });
                    continue;
                }

                // Check if user already exists in auth
                const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = existingUsers?.users?.find(
                    (u) => u.email?.toLowerCase() === email
                );

                let userId;

                if (existingUser) {
                    userId = existingUser.id;
                    // User exists — update profile with name/phone if provided
                    await supabaseAdmin
                        .from('profiles')
                        .update({
                            full_name: member.name || existingUser.user_metadata?.full_name,
                            phone: member.phone || null,
                        })
                        .eq('id', userId);

                    results.push({ email, status: 'existing_user', userId });
                } else {
                    // Create new user via inviteUserByEmail
                    // This automatically sends them an invite email with a magic link!
                    const { data: inviteData, error: inviteError } =
                        await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
                            data: {
                                full_name: member.name || email.split('@')[0],
                                phone: member.phone || '',
                            },
                        });

                    if (inviteError) {
                        results.push({ email, status: 'error', reason: inviteError.message });
                        continue;
                    }

                    userId = inviteData.user.id;

                    // Wait a moment for the auth trigger to create the profile
                    await new Promise((r) => setTimeout(r, 500));

                    // Update profile with phone if provided
                    if (member.phone) {
                        await supabaseAdmin
                            .from('profiles')
                            .update({ phone: member.phone })
                            .eq('id', userId);
                    }

                    results.push({ email, status: 'invited', userId });
                }

                // Ensure org_member exists
                await supabaseAdmin
                    .from('org_members')
                    .upsert(
                        { organization_id: org_id, user_id: userId, role: 'member' },
                        { onConflict: 'organization_id,user_id' }
                    );

                // Ensure team_member exists
                const { data: teamMember } = await supabaseAdmin
                    .from('team_members')
                    .upsert(
                        { team_id, user_id: userId },
                        { onConflict: 'team_id,user_id' }
                    )
                    .select('id')
                    .single();

                // Assign roles if specified
                if (role_ids.length > 0 && teamMember) {
                    const mrRows = role_ids.map((roleId) => ({
                        team_member_id: teamMember.id,
                        team_role_id: roleId,
                    }));
                    await supabaseAdmin
                        .from('member_roles')
                        .upsert(mrRows, { onConflict: 'team_member_id,team_role_id' });
                }
            } catch (err) {
                results.push({
                    email: member.email,
                    status: 'error',
                    reason: err.message,
                });
            }
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
