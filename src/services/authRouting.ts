export type AuthRouteInput = {
  authConfigured: boolean;
  signedIn: boolean;
  authLoading: boolean;
  onboardingCompleted: boolean;
  pathname: string;
};

export function getRequiredAuthRoute(input: AuthRouteInput): string | null {
  if (input.authLoading) return null;

  const publicRoutes = ['/auth', '/onboarding'];
  const isPublic = publicRoutes.some((route) => input.pathname === route);

  if (input.authConfigured && !input.signedIn) {
    return isPublic && input.pathname === '/auth' ? null : '/auth';
  }

  if (!input.onboardingCompleted) {
    return input.pathname === '/onboarding' ? null : '/onboarding';
  }

  if (input.pathname === '/auth' || input.pathname === '/onboarding') return '/';
  return null;
}

export function canStoreAIMemory(consent: boolean) {
  return consent === true;
}

export function canStoreCycleData(consent: boolean) {
  return consent === true;
}
