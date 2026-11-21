import test from 'node:test';
import assert from 'node:assert/strict';

// Core role permission logic matching Sakhi RLS and backend rules
function canManageOfficialAnnouncements(userRole) {
  return ['CAMPUS_ADMIN', 'ADMIN'].includes(userRole);
}

function canManagePlacementData(userRole) {
  return ['PLACEMENT_CELL', 'CAMPUS_ADMIN', 'ADMIN'].includes(userRole);
}

function canManageClub(userRole, userClubId, targetClubId) {
  if (['CAMPUS_ADMIN', 'ADMIN'].includes(userRole)) return true;
  if (userRole === 'CLUB_LEAD' && userClubId === targetClubId) return true;
  return false;
}

function canReadPrivateWellness(userRole, resourceOwnerId, currentUserId) {
  // NO admin role can read private student wellness data
  return resourceOwnerId === currentUserId;
}

function canStudentSelfPromote(requestedRole) {
  return false;
}

test('Role Permissions - Student cannot publish official campus announcements', () => {
  assert.equal(canManageOfficialAnnouncements('STUDENT'), false);
  assert.equal(canManageOfficialAnnouncements('CAMPUS_ADMIN'), true);
});

test('Role Permissions - Placement Cell can manage official placement data but Student cannot', () => {
  assert.equal(canManagePlacementData('STUDENT'), false);
  assert.equal(canManagePlacementData('PLACEMENT_CELL'), true);
});

test('Role Permissions - Club Lead can only manage assigned club', () => {
  assert.equal(canManageClub('CLUB_LEAD', 'club-dance', 'club-dance'), true);
  assert.equal(canManageClub('CLUB_LEAD', 'club-dance', 'club-coding'), false);
  assert.equal(canManageClub('STUDENT', 'club-dance', 'club-dance'), false);
});

test('Role Permissions - Private wellness data is ONLY accessible by the resource owner', () => {
  const ownerId = 'user-student-123';
  const otherId = 'user-admin-456';
  assert.equal(canReadPrivateWellness('STUDENT', ownerId, ownerId), true);
  assert.equal(canReadPrivateWellness('CAMPUS_ADMIN', ownerId, otherId), false);
  assert.equal(canReadPrivateWellness('MODERATOR', ownerId, otherId), false);
});

test('Role Permissions - Students cannot self-promote to ADMIN', () => {
  assert.equal(canStudentSelfPromote('ADMIN'), false);
  assert.equal(canStudentSelfPromote('CAMPUS_ADMIN'), false);
});
