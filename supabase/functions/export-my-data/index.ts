import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  const { user, client, error } = await requireUser(request);
  if (!user || !client) return jsonResponse(request, 401, { error });

  const exported: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
  };

  const tableNames = [
    "profiles", "interests", "consents", "wellness_logs", "cycle_entries",
    "sakhi_memories", "sakhi_conversations", "planner_items", "campus_memberships",
    "connections", "direct_messages", "notifications",
  ];

  for (const tableName of tableNames) {
    let query = client.from(tableName).select("*");
    if (tableName === "profiles") {
      query = query.eq("id", user.id);
    } else if (tableName !== "consents") {
      const ownerColumn =
        tableName === "direct_messages" ? "sender_id" :
        tableName === "connections" ? "requester_id" :
        "user_id";
      query = tableName === "direct_messages"
        ? query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        : tableName === "connections"
          ? query.or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          : query.eq(ownerColumn, user.id);
    } else {
      query = query.eq("user_id", user.id);
    }

    const { data, error: readError } = await query;
    if (readError) {
      return jsonResponse(request, 500, { error: "Data export failed" });
    }
    exported[tableName] = data ?? [];
  }

  return jsonResponse(request, 200, exported);
});
