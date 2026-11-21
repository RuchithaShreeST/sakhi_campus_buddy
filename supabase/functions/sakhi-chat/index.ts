import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { detectCrisis, moderateInput, validateModelOutput } from "../_shared/safety.ts";

type ChatBody = { message?: unknown; stream?: unknown };

async function callProvider(systemPrompt: string, message: string, context: unknown) {
  const endpoint = Deno.env.get("AI_ENDPOINT");
  const apiKey = Deno.env.get("AI_API_KEY");
  const fallbackEndpoint = Deno.env.get("AI_FALLBACK_ENDPOINT");
  const fallbackApiKey = Deno.env.get("AI_FALLBACK_API_KEY");
  const model = Deno.env.get("AI_MODEL") || "default";
  const providers = [
    endpoint && apiKey ? { endpoint, apiKey } : null,
    fallbackEndpoint && fallbackApiKey ? { endpoint: fallbackEndpoint, apiKey: fallbackApiKey } : null,
  ].filter(Boolean) as { endpoint: string; apiKey: string }[];
  if (!providers.length) throw new Error("AI provider is not configured");

  let lastError: unknown;
  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(provider.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: JSON.stringify({ message, context }) },
            ],
            temperature: 0.7,
            max_tokens: 700,
          }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Provider returned ${response.status}`);
        return await response.json();
      } catch (providerError) {
        lastError = providerError;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
  throw lastError ?? new Error("AI provider unavailable");
}

async function callFallback(message: string) {
  const lower = message.toLowerCase();
  if (/\bstress|overwhel|anxious/.test(lower)) {
    return "Take one slow breath. We only need to handle the next small step, not everything at once.";
  }
  if (/\bstudy|exam|assignment|dsa/.test(lower)) {
    return "Let’s make it manageable: choose one 25-minute study block, then take a real break.";
  }
  if (/\btired|sleep|exhaust/.test(lower)) {
    return "Your energy matters. A short pause or earlier wind-down may feel more supportive than pushing through.";
  }
  return "I’m here with you. What would feel like one helpful step right now?";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }
  if (new Blob([await request.clone().arrayBuffer()]).size > 16000) {
    return jsonResponse(request, 413, { error: "Request is too large" });
  }

  const { user, client, error } = await requireUser(request);
  if (!user || !client) return jsonResponse(request, 401, { error });

  let body: ChatBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(request, 400, { error: "Invalid JSON" });
  }
  if (typeof body.message !== "string") {
    return jsonResponse(request, 400, { error: "A message string is required" });
  }

  const moderation = moderateInput(body.message);
  if (!moderation.allowed) {
    return jsonResponse(request, 400, { error: moderation.reason });
  }

  const { data: allowed, error: rateLimitError } = await client.rpc("consume_sakhi_ai_rate_limit");
  if (rateLimitError || typeof allowed !== "boolean") {
    return jsonResponse(request, 503, { error: "Sakhi is temporarily unavailable" });
  }
  if (!allowed) {
    return jsonResponse(request, 429, { error: "Too many Sakhi requests. Please wait a minute." });
  }

  const { data: consents, error: consentError } = await client
    .from("consents")
    .select("ai_memory_opt_in,cycle_tracking_opt_in")
    .eq("user_id", user.id)
    .maybeSingle();
  if (consentError) {
    return jsonResponse(request, 500, { error: "Could not read privacy settings" });
  }

  let memories = [];
  let cycles = [];
  if (consents?.ai_memory_opt_in) {
    const result = await client
      .from("sakhi_memories")
      .select("label,value")
      .eq("user_id", user.id)
      .limit(8);
    if (result.error) {
      return jsonResponse(request, 500, { error: "Could not read consented Sakhi context" });
    }
    memories = result.data ?? [];
  }
  if (consents?.cycle_tracking_opt_in) {
    const result = await client
      .from("cycle_entries")
      .select("start_date,end_date,flow,symptoms")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(10);
    if (result.error) {
      return jsonResponse(request, 500, { error: "Could not read consented Sakhi context" });
    }
    cycles = result.data ?? [];
  }

  const context = {
    memories,
    cycle_entries: cycles,
  };

  const crisis = detectCrisis(body.message);
  const systemPrompt = `You are Sakhi, a warm campus friend and mentor. Never diagnose medical conditions or prescribe medication. Never claim to be an official representative or real person. Campus facts must cite a source and trust_label. Respond with concise supportive language.`;

  let text: string;
  let source = "provider";
  try {
    const result = await callProvider(systemPrompt, body.message, context);
    text = result.choices?.[0]?.message?.content ?? result.output_text ?? "";
  } catch {
    source = "fallback";
    text = await callFallback(body.message);
  }

  const safeText = validateModelOutput(text);
  if (!safeText) {
    text = "I can support you with a small next step, but I cannot provide a diagnosis or medication advice.";
  } else {
    text = safeText;
  }

  const crisisSupport = crisis ? {
    resources: [
      { name: "Tele-MANAS", phone: "14416" },
      { name: "Campus counsellor", configured: false },
    ],
    message: "You deserve support from a real person right now. Please contact Tele-MANAS at 14416 or a trusted person you can reach.",
  } : null;

  if (body.stream === true) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text, source, crisis_support: crisisSupport })}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { ...corsHeaders(request), "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }

  const { error: conversationError } = await client.from("sakhi_conversations").insert([
    { user_id: user.id, role: "user", message: body.message },
    { user_id: user.id, role: "assistant", message: text },
  ]);
  if (conversationError) {
    return jsonResponse(request, 500, { error: "Could not save this conversation" });
  }

  return jsonResponse(request, 200, {
    message: text,
    source,
    crisis_support: crisisSupport,
  });
});
