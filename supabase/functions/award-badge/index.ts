import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface AwardBadgePayload {
  user_id: string;
  badge_slug: string;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Use the service-role client so we can bypass RLS for badge writes.
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let payload: AwardBadgePayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { user_id, badge_slug } = payload;

  if (!user_id || !badge_slug) {
    return new Response(
      JSON.stringify({ error: 'user_id and badge_slug are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 1. Resolve badge slug → id
  const { data: badge, error: badgeError } = await supabase
    .from('badges')
    .select('id')
    .eq('slug', badge_slug)
    .single();

  if (badgeError || !badge) {
    return new Response(JSON.stringify({ error: 'Badge not found', badge_slug }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Check if already granted (unique constraint would also block it, but
  //    we return a friendly response instead of a 409 constraint error).
  const { data: existing } = await supabase
    .from('badge_grants')
    .select('id')
    .eq('user_id', user_id)
    .eq('badge_id', badge.id)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ already_granted: true, badge_slug }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3. Grant the badge
  const { data: grant, error: grantError } = await supabase
    .from('badge_grants')
    .insert({ user_id, badge_id: badge.id })
    .select()
    .single();

  if (grantError) {
    return new Response(JSON.stringify({ error: grantError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ granted: true, badge_slug, grant }),
    { status: 201, headers: { 'Content-Type': 'application/json' } },
  );
});
