require('sucrase/register/ts');

const assert = require('node:assert/strict');
const test = require('node:test');

const { deleteUserAccount } = require('../lib/account-deletion.ts');

function makeModel(name, calls, implementations = {}) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (implementations[prop]) return implementations[prop];
        return async (args) => {
          calls.push([`${name}.${String(prop)}`, args]);
          return [];
        };
      },
    }
  );
}

test('deleteUserAccount removes dependent data before deleting the user', async () => {
  const calls = [];
  const tx = {
    group: makeModel('group', calls, {
      findMany: async (args) => {
        calls.push(['group.findMany', args]);
        return [{ id: 'group-owned' }];
      },
      deleteMany: async (args) => {
        calls.push(['group.deleteMany', args]);
        return { count: 1 };
      },
    }),
    restaurant: makeModel('restaurant', calls, {
      findMany: async (args) => {
        calls.push(['restaurant.findMany', args]);
        return [{ id: 'restaurant-owned' }];
      },
      deleteMany: async (args) => {
        calls.push(['restaurant.deleteMany', args]);
        return { count: 1 };
      },
    }),
    lunchDecision: makeModel('lunchDecision', calls, {
      findMany: async (args) => {
        calls.push(['lunchDecision.findMany', args]);
        return [{ id: 'decision-owned' }];
      },
      deleteMany: async (args) => {
        calls.push(['lunchDecision.deleteMany', args]);
        return { count: 1 };
      },
    }),
    decisionOption: makeModel('decisionOption', calls),
    vote: makeModel('vote', calls),
    userFavorite: makeModel('userFavorite', calls),
    rating: makeModel('rating', calls),
    comment: makeModel('comment', calls),
    pushSubscription: makeModel('pushSubscription', calls),
    userPreferences: makeModel('userPreferences', calls),
    groupMember: makeModel('groupMember', calls),
    user: makeModel('user', calls, {
      delete: async (args) => {
        calls.push(['user.delete', args]);
        return { id: 'user-1' };
      },
    }),
  };
  const prisma = {
    $transaction: async (callback) => callback(tx),
  };

  await deleteUserAccount(prisma, 'user-1');

  assert.deepEqual(calls.map(([name]) => name), [
    'group.findMany',
    'restaurant.findMany',
    'lunchDecision.findMany',
    'vote.deleteMany',
    'userFavorite.deleteMany',
    'rating.deleteMany',
    'comment.deleteMany',
    'pushSubscription.deleteMany',
    'userPreferences.deleteMany',
    'decisionOption.deleteMany',
    'restaurant.deleteMany',
    'lunchDecision.deleteMany',
    'groupMember.deleteMany',
    'group.deleteMany',
    'user.delete',
  ]);
  assert.deepEqual(calls.at(-1), ['user.delete', { where: { id: 'user-1' } }]);
});
