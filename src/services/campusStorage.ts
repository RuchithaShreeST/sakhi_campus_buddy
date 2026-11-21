import AsyncStorage from '@react-native-async-storage/async-storage';
import { campusClubs, campusEvents, campusQuestions, communityPosts, mockConnections, placementItems } from '@/data/campusData';
import { CampusState } from '@/types/campus';

const SAKHI_KEY = '@sakhi/campus-state';
const LEGACY_KEY = '@mira/campus-state';

export async function loadCampusState(): Promise<CampusState> {
  try {
    let stored = await AsyncStorage.getItem(SAKHI_KEY);
    if (!stored) stored = await AsyncStorage.getItem(LEGACY_KEY);
    if (!stored)
      return {
        events: campusEvents,
        clubs: campusClubs,
        posts: communityPosts,
        placements: placementItems,
        questions: campusQuestions,
        connections: mockConnections,
        interests: [],
        notifications: 0,
      };
    return {
      events: campusEvents,
      clubs: campusClubs,
      posts: communityPosts,
      placements: placementItems,
      questions: campusQuestions,
      connections: mockConnections,
      interests: [],
      notifications: 0,
      ...JSON.parse(stored),
    };
  } catch {
    return {
      events: campusEvents,
      clubs: campusClubs,
      posts: communityPosts,
      placements: placementItems,
      questions: campusQuestions,
      connections: mockConnections,
      interests: [],
      notifications: 0,
    };
  }
}

export async function saveCampusState(state: CampusState) {
  await AsyncStorage.setItem(SAKHI_KEY, JSON.stringify(state));
}

