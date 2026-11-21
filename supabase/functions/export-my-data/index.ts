import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { USER_DATA_EXPORT } from "../_shared/user-data-export.ts";

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

  const pageSize = 1000;
  for (const { table, ownerColumns } of USER_DATA_EXPORT) {
    const rows: unknown[] = [];
    for (let offset = 0; ; offset += pageSize) {
      let query = client.from(table).select("*");
      if (ownerColumns.length === 1) {
        query = query.eq(ownerColumns[0], user.id);
      } else {
        query = query.or(ownerColumns.map((column) => `${column}.eq.${user.id}`).join(","));
      }

      const { data, error: readError } = await query.range(offset, offset + pageSize - 1);
      if (readError || !data) {
        return jsonResponse(request, 500, { error: "Data export failed" });
      }

      rows.push(...data);
      if (data.length < pageSize) break;
    }

    exported[table] = rows;
  }

  return jsonResponse(request, 200, exported);
});
