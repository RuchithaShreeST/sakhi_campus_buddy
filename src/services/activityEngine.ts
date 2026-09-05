import { getActivityDefinition } from '@/data/activityCatalog';
import { ActivitySession, ActivityType, CompanionState } from '@/types/wellness';

const stateByType: Partial<Record<ActivityType, CompanionState>> = {
  walking: 'walking', running: 'running', workout: 'exercising', exercise: 'exercising', yoga: 'calm', stretching: 'calm', meditation: 'calm', breathing: 'calm', resting: 'needsRest',
  studying: 'studying', working: 'working', reading: 'reading', learning: 'studying', tasks: 'working', deepWork: 'working', break: 'calm',
  movie: 'watchingMovie', series: 'watchingMovie', dancing: 'dancing', music: 'music', gaming: 'happy', drawing: 'calm', painting: 'calm', photography: 'happy', cooking: 'happy', shopping: 'happy', travelling: 'happy', gardening: 'calm',
  friends: 'social', family: 'social', calling: 'social', socializing: 'social', outing: 'social',
  clubActivity: 'social', campusEvent: 'social', studyGroup: 'studying', workshop: 'focused', volunteering: 'social',
  skincare: 'selfCare', hairCare: 'selfCare', relaxing: 'selfCare', journaling: 'selfCare', selfCare: 'selfCare', personalTime: 'calm', custom: 'happy',
};

export function getCompanionStateForActivity(type: ActivityType): CompanionState {
  return stateByType[type] ?? getActivityDefinition(type)?.companionState ?? 'happy';
}

export function getActivityMessage(type: ActivityType): string {
  const messages: Partial<Record<ActivityType, string>> = {
    walking: "Let's keep moving!", running: "You're on fire!", workout: 'Strong looks good on you!', studying: "You've got this.", working: 'One step at a time.', reading: 'A little quiet time sounds nice.', dancing: 'Dance it out!', movie: 'Enjoy your movie night.', music: 'Good vibes only.', meditation: 'Take a breath.', selfCare: 'You deserve this time.', friends: 'Connection is a lovely thing.', resting: 'Rest is part of the rhythm.',
  };
  return messages[type] ?? 'Make this moment yours.';
}

export function getSessionName(session: ActivitySession): string {
  return session.name ?? getActivityDefinition(session.type)?.name ?? session.type;
}

export function getSessionIcon(session: ActivitySession): string {
  return session.icon ?? getActivityDefinition(session.type)?.icon ?? '○';
}
