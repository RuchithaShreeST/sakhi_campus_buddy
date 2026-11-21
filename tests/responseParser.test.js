import test from 'node:test';
import assert from 'node:assert/strict';

import { parseMiraResponse } from '../server/ai/responseParser.js';

test('AI Response Parser - Valid JSON payload returns parsed response', () => {
  const input = JSON.stringify({
    message: 'Hello! I am Sakhi.',
    tone: 'warm',
    companionState: 'happy',
    intent: 'greeting',
    recommendations: ['Check out dance club'],
    actions: [{ type: 'OPEN_CLUBS', label: 'View Clubs' }],
  });

  const parsed = parseMiraResponse(input);
  assert.equal(parsed.message, 'Hello! I am Sakhi.');
  assert.equal(parsed.companionState, 'happy');
  assert.equal(parsed.tone, 'warm');
  assert.equal(parsed.actions.length, 1);
  assert.equal(parsed.actions[0].type, 'OPEN_CLUBS');
});

test('AI Response Parser - Invalid/Malformed input falls back cleanly without crash', () => {
  assert.throws(() => parseMiraResponse(null), /Invalid MIRA response/);
  assert.throws(() => parseMiraResponse('{ bad json }'), SyntaxError);
});

test('AI Response Parser - Unallowed state falls back to comforting', () => {
  const input = JSON.stringify({
    message: 'Rest easy.',
    companionState: 'NON_EXISTENT_STATE',
  });
  const parsed = parseMiraResponse(input);
  assert.equal(parsed.companionState, 'comforting');
});
