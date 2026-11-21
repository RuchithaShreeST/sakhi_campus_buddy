import { SakhiAiContext, SakhiAiResponse } from './aiTypes';
import { getLocalSakhiResponse } from './localFallback';
import { parseSakhiResponse } from './responseParser';

export async function askSakhi(message: string, context: SakhiAiContext): Promise<{ response: SakhiAiResponse; source: 'ai' | 'local' }> {
  const apiUrl = typeof process !== 'undefined'
    ? (process.env.EXPO_PUBLIC_SAKHI_API_URL || process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_MIRA_API_URL)
    : undefined;

  if (!apiUrl) return { response: getLocalSakhiResponse(message, context), source: 'local' };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const result = await fetch(`${apiUrl.replace(/\/$/, '')}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!result.ok) throw new Error(`AI request failed with status: ${result.status}`);
    const parsed = parseSakhiResponse(await result.json());
    if (!parsed) throw new Error('Invalid Sakhi AI response');
    return { response: parsed, source: 'ai' };
  } catch {
    return { response: getLocalSakhiResponse(message, context), source: 'local' };
  }
}

/** @deprecated Legacy alias */
export const askMira = askSakhi;

