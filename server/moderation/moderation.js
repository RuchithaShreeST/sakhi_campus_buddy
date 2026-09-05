const reportReasons = ['harassment', 'spam', 'scam', 'impersonation', 'inappropriate', 'threat', 'misinformation', 'other'];
export function validateReport(input) { return Boolean(input && typeof input.targetId === 'string' && typeof input.targetType === 'string' && reportReasons.includes(input.reason)); }
export function moderationBoundary({ content, actor }) { return { allowed: true, reason: null, requiresHumanReview: false, actorId: actor?.id, contentLength: typeof content === 'string' ? content.length : 0 }; }
// This is an integration boundary, not a claim that keyword checks are complete moderation.
