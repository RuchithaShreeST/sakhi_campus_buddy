import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireUser(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { user: null, error: "Authorization required" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return { user: null, error: "Auth configuration missing" };
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return { user: null, error: "Invalid or expired JWT" };
  }

  return { user: data.user, client };
}
