import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, 400, { error: "Invalid JSON" });
  }

  if (!body || typeof body !== "object") {
    return jsonResponse(request, 400, { error: "Invalid consent payload" });
  }

  const payload = body as Record<string, unknown>;
  const allowed = ["ai_memory_opt_in", "cycle_tracking_opt_in", "discovery_visible"];
  if (Object.keys(payload).some((key) => !allowed.includes(key))) {
    return jsonResponse(request, 400, { error: "Unknown consent field" });
  }

  for (const value of Object.values(payload)) {
    if (typeof value !== "boolean") {
      return jsonResponse(request, 400, { error: "Consent values must be boolean" });
    }
  }

  const { user, client, error } = await requireUser(request);
  if (!user || !client) return jsonResponse(request, 401, { error });

  const { data, error: updateError } = await client
    .from("consents")
    .update(payload)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    return jsonResponse(request, 500, { error: "Consent update failed" });
  }

  return jsonResponse(request, 200, { consent: data });
});
