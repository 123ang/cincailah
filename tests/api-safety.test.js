require('sucrase/register/ts');

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CreateRestaurantSchema,
  RatingSchema,
  UpdateRestaurantSchema,
} = require('../lib/schemas.ts');
const {
  memberUserSelect,
  publicVoteUserSelect,
  toPublicVoteUser,
} = require('../lib/response-shapes.ts');

test('restaurant create schema rejects invalid prices and unsafe photo paths', () => {
  const result = CreateRestaurantSchema.safeParse({
    groupId: '00000000-0000-0000-0000-000000000001',
    name: 'Too Weird',
    cuisineTags: ['Mamak'],
    vibeTags: ['Cheap'],
    priceMin: 30,
    priceMax: 10,
    halal: true,
    vegOptions: false,
    walkMinutes: 5,
    photoUrl: 'javascript:alert(1)',
  });

  assert.equal(result.success, false);
});

test('restaurant update schema supports partial updates but keeps invariants', () => {
  assert.equal(UpdateRestaurantSchema.safeParse({ name: 'New name' }).success, true);
  assert.equal(UpdateRestaurantSchema.safeParse({ priceMin: 50, priceMax: 10 }).success, false);
  assert.equal(UpdateRestaurantSchema.safeParse({ photoUrl: '/uploads/restaurants/a.jpg' }).success, true);
  assert.equal(UpdateRestaurantSchema.safeParse({ photoUrl: 'https://example.com/a.jpg' }).success, true);
  assert.equal(UpdateRestaurantSchema.safeParse({ photoUrl: 'javascript:alert(1)' }).success, false);
});

test('rating schema requires UUID ids and thumbs direction', () => {
  assert.equal(RatingSchema.safeParse({
    restaurantId: 'not-a-uuid',
    decisionId: null,
    thumbs: 'up',
  }).success, false);

  assert.equal(RatingSchema.safeParse({
    restaurantId: '00000000-0000-0000-0000-000000000001',
    decisionId: '00000000-0000-0000-0000-000000000002',
    thumbs: 'down',
  }).success, true);
});

test('public user response helpers never expose sensitive fields', () => {
  assert.deepEqual(memberUserSelect, {
    id: true,
    displayName: true,
    avatarUrl: true,
  });

  assert.deepEqual(publicVoteUserSelect, {
    id: true,
    displayName: true,
    avatarUrl: true,
  });

  const publicUser = toPublicVoteUser({
    id: 'u1',
    email: 'private@example.com',
    displayName: 'Aang',
    avatarUrl: '/uploads/avatars/u1.jpg',
    passwordHash: 'secret',
    resetToken: 'reset',
    emailVerifyToken: 'verify',
  });

  assert.deepEqual(publicUser, {
    id: 'u1',
    displayName: 'Aang',
    avatarUrl: '/uploads/avatars/u1.jpg',
  });
});
