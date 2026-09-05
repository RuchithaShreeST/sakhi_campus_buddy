import { CompanionState } from '@/types/wellness';

export type GirlAccessory = 'none' | 'book' | 'laptop' | 'headphones' | 'movie' | 'sparkle' | 'tea';

export const girlStateConfig: Record<CompanionState, { label: string; accessory: GirlAccessory; message: string }> = {
  idle: { label: 'Here with you', accessory: 'none', message: 'I am right here.' },
  happy: { label: 'Happy', accessory: 'sparkle', message: 'A little joy looks lovely on you.' },
  energetic: { label: 'Energetic', accessory: 'sparkle', message: 'You are glowing with good energy.' },
  balanced: { label: 'Balanced', accessory: 'none', message: 'You are finding a lovely rhythm.' },
  walking: { label: 'Walking', accessory: 'none', message: "Let's keep moving!" },
  running: { label: 'Running', accessory: 'none', message: "You're on fire!" },
  exercising: { label: 'Workout', accessory: 'none', message: 'Strong looks good on you.' },
  studying: { label: 'Studying', accessory: 'book', message: "You've got this." },
  working: { label: 'Working', accessory: 'laptop', message: 'One step at a time.' },
  reading: { label: 'Reading', accessory: 'book', message: 'A little quiet time sounds nice.' },
  dancing: { label: 'Dancing', accessory: 'sparkle', message: 'Dance it out!' },
  watchingMovie: { label: 'Movie time', accessory: 'movie', message: 'Enjoy your movie night.' },
  music: { label: 'Music', accessory: 'headphones', message: 'Good vibes only.' },
  selfCare: { label: 'Self care', accessory: 'tea', message: 'You deserve this time.' },
  periodCare: { label: 'Period care', accessory: 'tea', message: 'Let’s make today gentler.' },
  comforting: { label: 'Here with you', accessory: 'tea', message: 'You do not have to hold it all alone.' },
  social: { label: 'Social time', accessory: 'sparkle', message: 'Connection is a lovely thing.' },
  sleeping: { label: 'Sleeping', accessory: 'none', message: 'Sweet dreams.' },
  sleepy: { label: 'Sleepy', accessory: 'tea', message: 'A gentle reset could feel lovely.' },
  tired: { label: 'Tired', accessory: 'tea', message: 'It is okay to slow down.' },
  calm: { label: 'Calm', accessory: 'none', message: 'Take a breath.' },
  celebrating: { label: 'Celebrating', accessory: 'sparkle', message: 'You did it. Let this win be enough.' },
  concerned: { label: 'Here with you', accessory: 'tea', message: 'You do not have to do everything at once.' },
  needsRest: { label: 'Needs rest', accessory: 'tea', message: 'Rest is part of the rhythm.' },
  planning: { label: 'Planning', accessory: 'laptop', message: 'Let’s keep today human-sized.' },
  focused: { label: 'Deep focus', accessory: 'book', message: 'You are in the flow.' },
};
