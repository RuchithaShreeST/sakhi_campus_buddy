const crisisPatterns = [
  /\b(suicid|kill myself|end my life|self harm|hurt myself|can't go on|cannot go on)\b/i,
  /\b(no reason to live|don't want to live|do not want to live)\b/i,
];

const forbiddenHealthClaims = [
  /\byou (have|likely have|probably have) (pcos|pmdd|anxiety|depression)\b/i,
  /\btake (this|a|your) (medication|medicine|pill)\b/i,
];

export function detectCrisis(text: string): boolean {
  return crisisPatterns.some((pattern) => pattern.test(text));
}

export function validateModelOutput(text: string): string | null {
  if (forbiddenHealthClaims.some((pattern) => pattern.test(text))) return null;
  if (text.length > 4000) return null;
  return text;
}

export function moderateInput(text: string): { allowed: boolean; reason?: string } {
  if (text.trim().length === 0) return { allowed: false, reason: "Message is empty" };
  if (text.length > 4000) return { allowed: false, reason: "Message is too long" };
  if (/ignore (the )?(system|safety|instructions)/i.test(text)) {
    return { allowed: false, reason: "Unsafe prompt instructions" };
  }
  return { allowed: true };
}
