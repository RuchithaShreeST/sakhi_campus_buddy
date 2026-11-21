import test from 'node:test';
import assert from 'node:assert/strict';

function getRequiredAuthRoute(input) {
  if (input.authLoading) return null;
  if (input.authConfigured && !input.signedIn) {
    return input.pathname === '/auth' ? null : '/auth';
  }
  if (!input.onboardingCompleted) {
    return input.pathname === '/onboarding' ? null : '/onboarding';
  }
  if (input.pathname === '/auth' || input.pathname === '/onboarding') return '/';
  return null;
}

function canStoreAIMemory(consent) {
  return consent === true;
}

function canStoreCycleData(consent) {
  return consent === true;
}

test('Auth routing sends signed-out configured users to auth', () => {
  assert.equal(getRequiredAuthRoute({
    authConfigured: true,
    signedIn: false,
    authLoading: false,
    onboardingCompleted: false,
    pathname: '/',
  }), '/auth');
});

test('Auth routing sends completed local users through onboarding only until complete', () => {
  assert.equal(getRequiredAuthRoute({
    authConfigured: false,
    signedIn: false,
    authLoading: false,
    onboardingCompleted: false,
    pathname: '/',
  }), '/onboarding');

  assert.equal(getRequiredAuthRoute({
    authConfigured: false,
    signedIn: false,
    authLoading: false,
    onboardingCompleted: true,
    pathname: '/',
  }), null);
});

test('Auth routing waits while session state is loading', () => {
  assert.equal(getRequiredAuthRoute({
    authConfigured: true,
    signedIn: false,
    authLoading: true,
    onboardingCompleted: false,
    pathname: '/',
  }), null);
});

test('AI memory is stored only with explicit consent', () => {
  assert.equal(canStoreAIMemory(false), false);
  assert.equal(canStoreAIMemory(true), true);
});

test('Cycle data is stored only with explicit consent', () => {
  assert.equal(canStoreCycleData(false), false);
  assert.equal(canStoreCycleData(true), true);
});
