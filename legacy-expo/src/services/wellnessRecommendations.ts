import { getLifestyleTotals } from '@/services/wellnessEngine';
import { Recommendation, WellnessData } from '@/types/wellness';

export type RecommendationContext = { currentFeeling?: string; severity?: string; timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'; data: WellnessData };

export function getRecommendations({ currentFeeling, severity, timeOfDay, data }: RecommendationContext): Recommendation[] {
  const totals = getLifestyleTotals(data);
  const recommendations: Recommendation[] = [];
  const periodFeeling = currentFeeling === 'period' || currentFeeling === 'periodCramps' || data.cycleEntries.length > 0;
  if (periodFeeling || currentFeeling === 'inPain') recommendations.push({ id: 'gentle-rest', title: 'Make today gentler', description: severity === 'strong' || severity === 'very strong' ? 'That sounds uncomfortable. Choose a softer pace, and consider speaking with a healthcare professional if it is severe, unusual, or worsening.' : 'Try warmth, water, rest, or a quiet self-care moment.', category: 'Self Care', duration: 10, priority: 'high', icon: '♡', actionType: 'rest' });
  if (currentFeeling === 'stressed' || currentFeeling === 'overwhelmed' || currentFeeling === 'anxious') recommendations.push({ id: 'breathing-reset', title: 'One-minute breathing', description: 'Let’s make the next minute smaller and softer.', category: 'Wellness', duration: 1, priority: 'high', icon: '○', actionType: 'activity' });
  if (currentFeeling === 'tired' || data.sleep.duration < data.profile.sleepGoal * 0.75) recommendations.push({ id: 'rest-pause', title: 'Take a real pause', description: 'You have already done enough to deserve a little room to recharge.', category: 'Self Care', duration: 5, priority: 'high', icon: '☾', actionType: 'rest' });
  if (totals.productivity >= 180 && totals.movement < 30) recommendations.push({ id: 'movement-reset', title: 'Five-minute reset', description: 'You have had a focused day. Let’s step away from the screen for a moment.', category: 'Wellness', duration: 5, priority: 'high', icon: '↗', actionType: 'activity' });
  if (data.water < data.profile.waterGoal * 0.6) recommendations.push({ id: 'hydration', title: 'Tiny hydration break', description: 'A glass of water, then back to whatever matters to you.', category: 'Wellness', duration: 1, priority: 'medium', icon: '◒', actionType: 'water' });
  if (timeOfDay === 'night') recommendations.push({ id: 'wind-down', title: 'Soft wind-down', description: 'Dim the day with music, stretching, or a few quiet pages.', category: 'Self Care', duration: 10, priority: 'medium', icon: '☾', actionType: 'activity' });
  if (recommendations.length === 0) recommendations.push({ id: 'joy-break', title: 'Choose a little joy', description: 'Want to keep the good energy going with music, a walk, or something creative?', category: 'Fun', duration: 15, priority: 'low', icon: '✦', actionType: 'activity' });
  return recommendations.slice(0, 3);
}
