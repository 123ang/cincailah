require('sucrase/register/ts');

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  CreateRestaurantSchema,
  RatingSchema,
  UpdateGroupSchema,
  UpdateRestaurantSchema,
} = require('../lib/schemas.ts');
const { getClientIp } = require('../lib/ratelimit.ts');
const { escapeHtml, timingSafeSecretEqual } = require('../lib/security.ts');
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

test('group update schema validates coverUrl together with every other field', () => {
  assert.equal(UpdateGroupSchema.safeParse({
    coverUrl: '/uploads/group-covers/group_1.jpg',
    name: 'Lunch Crew',
    noRepeatDays: 7,
  }).success, true);

  assert.equal(UpdateGroupSchema.safeParse({
    coverUrl: '/uploads/group-covers/group_1.jpg',
    name: 123,
    noRepeatDays: 999,
  }).success, false);

  assert.equal(UpdateGroupSchema.safeParse({
    coverUrl: '../../secret',
  }).success, false);
});

test('getClientIp selects the client before the configured trusted proxy hops', () => {
  const previous = process.env.TRUSTED_PROXY_HOPS;
  process.env.TRUSTED_PROXY_HOPS = '1';
  try {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': 'spoofed-client, 203.0.113.5',
        'x-real-ip': '198.51.100.2',
      },
    });
    assert.equal(getClientIp(request), '203.0.113.5');
  } finally {
    if (previous === undefined) delete process.env.TRUSTED_PROXY_HOPS;
    else process.env.TRUSTED_PROXY_HOPS = previous;
  }
});

test('security helpers escape email HTML and compare equal-length secrets safely', () => {
  assert.equal(
    escapeHtml('<b>A & "B"</b>'),
    '&lt;b&gt;A &amp; &quot;B&quot;&lt;/b&gt;'
  );
  assert.equal(timingSafeSecretEqual('same-secret', 'same-secret'), true);
  assert.equal(timingSafeSecretEqual('wrong', 'same-secret'), false);
  assert.equal(timingSafeSecretEqual(null, 'same-secret'), false);
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
