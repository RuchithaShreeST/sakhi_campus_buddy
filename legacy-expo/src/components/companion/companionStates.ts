import { CompanionState } from '@/types/wellness';

export const companionLabels: Record<CompanionState, string> = {
  idle: 'Here with you', happy: 'Happy', energetic: 'Energetic', balanced: 'Balanced', walking: 'Walking', running: 'Running', exercising: 'Workout', studying: 'Studying', working: 'Working', reading: 'Reading', dancing: 'Dancing', watchingMovie: 'Movie time', music: 'Music', selfCare: 'Self care', periodCare: 'Period care', comforting: 'Here with you', social: 'Social time', sleeping: 'Sleeping', sleepy: 'Sleepy', tired: 'Tired', calm: 'Calm', celebrating: 'Celebrating', concerned: 'Concerned', needsRest: 'Needs rest', planning: 'Planning', focused: 'Deep focus',
};

export const companionFaces: Record<CompanionState, string> = {
  idle: '◡', happy: '◡', energetic: '⌣', balanced: '◡', walking: '◡', running: '⌣', exercising: '◡', studying: '◡', working: '⌣', reading: '◡', dancing: '⌣', watchingMovie: '◡', music: '⌣', selfCare: '◡', periodCare: '︵', comforting: '◡', social: '⌣', sleeping: '—', sleepy: '﹀', tired: '﹀', calm: '◡', celebrating: '⌣', concerned: '︵', needsRest: '︵', planning: '◡', focused: '⌣',
};