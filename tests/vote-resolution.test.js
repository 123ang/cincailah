require('sucrase/register/ts');

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  canFinalizeVote,
  getTieBreak,
  getTiedRestaurantIds,
  selectWinningOption,
} = require('../lib/vote-resolution.ts');

const counts = (...pairs) => pairs.map(([restaurantId, count]) => ({ optionId: `o-${restaurantId}`, restaurantId, count }));

test('clear winner is never random and is not reported as a tie', () => {
  const votes = counts(['A', 2], ['B', 1], ['C', 0]);
  assert.equal(selectWinningOption(votes, () => 0.99).restaurantId, 'A');
  assert.deepEqual(getTiedRestaurantIds(votes), []);
});

test('1 vote vs 1 vote is a tie broken at random among the tied spots only', () => {
  const votes = counts(['A', 1], ['B', 1], ['C', 0]);
  assert.deepEqual(getTiedRestaurantIds(votes), ['A', 'B']);
  assert.equal(selectWinningOption(votes, () => 0).restaurantId, 'A');
  assert.equal(selectWinningOption(votes, () => 0.99).restaurantId, 'B');
});

test('tie info round-trips through stored constraints', () => {
  assert.deepEqual(getTieBreak({ tiedRestaurantIds: ['A', 'B', 3] }), ['A', 'B']);
  assert.deepEqual(getTieBreak(null), []);
});

test('only the vote starter or group owner can finalise early', () => {
  const base = { decisionCreatorId: 'starter', groupOwnerId: 'owner' };
  assert.equal(canFinalizeVote({ ...base, userId: 'starter' }), true);
  assert.equal(canFinalizeVote({ ...base, userId: 'owner' }), true);
  assert.equal(canFinalizeVote({ ...base, userId: 'member' }), false);
  assert.equal(canFinalizeVote({ userId: 'member', decisionCreatorId: 'starter', groupOwnerId: null }), false);
});
