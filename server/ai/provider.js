const endpoint = process.env.AI_ENDPOINT;
const apiKey = process.env.AI_API_KEY;
const model = process.env.AI_MODEL || 'mira-model';

export async function generateMiraResponse({ systemPrompt, context, message }) {
  if (!endpoint || !apiKey) throw new Error('AI provider is not configured');
  const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: JSON.stringify({ message, context }) }], temperature: 0.7 }) });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  return response.json();
}
