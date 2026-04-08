import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the calling user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await userClient.auth.getUser();
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const { data: callerRoles } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .single();

    if (!callerRoles || callerRoles.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action } = body;

    // ── LIST: return all users with roles ──
    if (action === 'list') {
      const { data: roles, error: rolesErr } = await adminClient
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesErr) throw rolesErr;

      // Get user emails from auth
      const userIds = (roles ?? []).map((r: any) => r.user_id);
      const userDetails: Array<{ id: string; email: string; role: string; created_at: string }> = [];

      for (const uid of userIds) {
        const { data: { user: u } } = await adminClient.auth.admin.getUserById(uid);
        const roleEntry = roles!.find((r: any) => r.user_id === uid);
        userDetails.push({
          id: uid,
          email: u?.email ?? 'unknown',
          role: roleEntry?.role ?? 'unknown',
          created_at: roleEntry?.created_at ?? '',
        });
      }

      return new Response(JSON.stringify({ users: userDetails }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── UPDATE: change a user's role ──
    if (action === 'update') {
      const { target_user_id, new_role } = body;

      if (!target_user_id || !new_role) {
        return new Response(JSON.stringify({ error: 'Missing target_user_id or new_role' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!['admin', 'student'].includes(new_role)) {
        return new Response(JSON.stringify({ error: 'Invalid role. Must be admin or student.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Prevent self-demotion
      if (target_user_id === caller.id) {
        return new Response(JSON.stringify({ error: 'Cannot change your own role' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get current role
      const { data: currentRole } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', target_user_id)
        .single();

      const oldRole = currentRole?.role ?? 'none';

      if (oldRole === new_role) {
        return new Response(JSON.stringify({ error: 'Role is already ' + new_role }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Update the role
      const { error: updateErr } = await adminClient
        .from('user_roles')
        .update({ role: new_role })
        .eq('user_id', target_user_id);

      if (updateErr) throw updateErr;

      // Log the change
      const { error: logErr } = await adminClient
        .from('role_change_log')
        .insert({
          target_user_id,
          old_role: oldRole,
          new_role,
          changed_by: caller.id,
        });

      if (logErr) console.error('Failed to log role change:', logErr);

      return new Response(JSON.stringify({ success: true, old_role: oldRole, new_role }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('update-role error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
