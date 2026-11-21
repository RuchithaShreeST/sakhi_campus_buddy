import { getLifestyleTotals } from '@/services/wellnessEngine';
import { Insight, WellnessData } from '@/types/wellness';

export function getWellnessInsight(data: WellnessData): Insight {
  const totals = getLifestyleTotals(data);
  const options: Insight[] = [];
  if (totals.productivity >= 180 && totals.movement < 30) options.push({ title: "Sakhi's Insight", body: "You've had a focused day. A short movement break could help you reset.", tone: 'lilac' });
  if (totals.movement >= 60 && data.sleep.duration < data.profile.sleepGoal) options.push({ title: "Sakhi's Insight", body: "You've been moving a lot today. Sakhi is feeling energetic with you, and a little recovery would be kind.", tone: 'sage' });
  if (totals.fun + totals.social >= 60 && data.sleep.duration >= data.profile.sleepGoal * 0.9) options.push({ title: "Sakhi's Insight", body: 'Looks like you made some time to recharge today. That balance matters.', tone: 'gold' });
  if (totals.selfCare >= 15 || data.activityHistory.some((activity) => activity.type === 'meditation')) options.push({ title: "Sakhi's Insight", body: 'Nice pause. Your day has some peaceful moments in it.', tone: 'rose' });
  if (data.completedGoals.length >= 4) options.push({ title: "Sakhi's Insight", body: 'You made space for your goals today. Sakhi is proud of the way you cared for yourself.', tone: 'gold' });
  if (data.water < data.profile.waterGoal * 0.6) options.push({ title: "Sakhi's Insight", body: "You're a little behind on hydration. How about a glass of water?", tone: 'sage' });
  return options[data.activityHistory.length % Math.max(options.length, 1)] ?? { title: "Sakhi's Insight", body: 'One small, kind choice is enough to shape the next part of your day.', tone: 'rose' };
}

