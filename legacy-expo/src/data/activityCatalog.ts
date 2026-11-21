import { ActivityDefinition, ActivityCategory, ActivityType, CompanionState } from '@/types/wellness';

type CatalogItem = [ActivityType, string, ActivityCategory, string, CompanionState, number?];

const items: CatalogItem[] = [
  ['walking', 'Walking', 'Fitness', '↗', 'walking', 25], ['running', 'Running', 'Fitness', '⌁', 'running', 30], ['workout', 'Workout', 'Fitness', '✦', 'exercising', 30], ['yoga', 'Yoga', 'Wellness', '◌', 'calm', 20], ['stretching', 'Stretching', 'Wellness', '∿', 'calm', 10], ['meditation', 'Meditation', 'Wellness', '◒', 'calm', 10], ['breathing', 'Breathing', 'Wellness', '○', 'calm', 5], ['resting', 'Rest', 'Wellness', '☾', 'needsRest', 20],
  ['studying', 'Study', 'Productivity', '▤', 'studying', 45], ['working', 'Work', 'Productivity', '▣', 'working', 60], ['reading', 'Reading', 'Productivity', '▥', 'reading', 30], ['learning', 'Learning', 'Productivity', '◇', 'studying', 30], ['tasks', 'Tasks', 'Productivity', '✓', 'working', 30], ['deepWork', 'Deep work', 'Productivity', '◈', 'working', 60], ['break', 'Break', 'Productivity', '○', 'calm', 10],
  ['movie', 'Movie', 'Fun', '▶', 'watchingMovie', 120], ['series', 'Series', 'Fun', '▹', 'watchingMovie', 45], ['dancing', 'Dance', 'Fun', '⌁', 'dancing', 30], ['music', 'Music', 'Fun', '♫', 'music', 30], ['gaming', 'Gaming', 'Fun', '⌘', 'happy', 60], ['drawing', 'Drawing', 'Fun', '✎', 'calm', 30], ['painting', 'Painting', 'Fun', '◒', 'calm', 45], ['photography', 'Photography', 'Fun', '▧', 'happy', 30], ['cooking', 'Cooking', 'Fun', '♢', 'happy', 45], ['shopping', 'Shopping', 'Fun', '◇', 'happy', 60], ['travelling', 'Travel', 'Fun', '⌖', 'happy', 120], ['gardening', 'Gardening', 'Fun', '✿', 'calm', 30],
  ['friends', 'Friends', 'Social', '◎', 'social', 60], ['family', 'Family time', 'Social', '⌂', 'social', 60], ['calling', 'Call someone', 'Social', '◌', 'social', 20], ['socializing', 'Social time', 'Social', '∞', 'social', 60], ['outing', 'Go outside', 'Social', '⊙', 'social', 30],
  ['clubActivity', 'Club activity', 'Social', '✦', 'social', 60], ['campusEvent', 'Campus event', 'Social', '◈', 'social', 90], ['studyGroup', 'Study group', 'Productivity', '▤', 'studying', 45], ['workshop', 'Workshop', 'Productivity', '◇', 'focused', 60], ['volunteering', 'Volunteering', 'Social', '♡', 'social', 90],
  ['skincare', 'Skincare', 'Self Care', '◇', 'selfCare', 15], ['hairCare', 'Hair care', 'Self Care', '✧', 'selfCare', 20], ['relaxing', 'Relax', 'Self Care', '⌁', 'selfCare', 20], ['journaling', 'Journaling', 'Self Care', '▤', 'selfCare', 15], ['selfCare', 'Self care', 'Self Care', '♡', 'selfCare', 30], ['personalTime', 'Personal time', 'Self Care', '○', 'calm', 30],
];

export const activityCatalog: ActivityDefinition[] = items.map(([type, name, category, icon, companionState, typicalMinutes]) => ({ id: type, name, type, category, icon, companionState, typicalMinutes }));

export const getActivityDefinition = (type: ActivityType) => activityCatalog.find((activity) => activity.type === type);

export const categoryList: ('All' | ActivityCategory)[] = ['All', 'Wellness', 'Fitness', 'Productivity', 'Fun', 'Social', 'Self Care', 'Other'];