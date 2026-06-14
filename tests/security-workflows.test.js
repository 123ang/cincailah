require('sucrase/register/ts');

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const {
  getRateLimitStoreMode,
  rateLimit,
  resetMemoryRateLimitStoreForTests,
} = require('../lib/ratelimit.ts');
const {
  getVoteExpiry,
  selectWinningOption,
} = require('../lib/vote-resolution.ts');

const root = join(__dirname, '..');

test('production rate limits use the shared database store by default', () => {
  assert.equal(getRateLimitStoreMode({ NODE_ENV: 'production' }), 'database');
  assert.equal(
    getRateLimitStoreMode({ NODE_ENV: 'development', RATE_LIMIT_STORE: 'database' }),
    'database',
  );
  assert.equal(getRateLimitStoreMode({ NODE_ENV: 'test' }), 'memory');
});

test('memory rate limiting remains deterministic for tests and local development', async () => {
  const previous = process.env.RATE_LIMIT_STORE;
  process.env.RATE_LIMIT_STORE = 'memory';
  resetMemoryRateLimitStoreForTests();

  try {
    assert.equal((await rateLimit('test-key', 2, 60_000)).success, true);
    assert.equal((await rateLimit('test-key', 2, 60_000)).success, true);
    assert.equal((await rateLimit('test-key', 2, 60_000)).success, false);
  } finally {
    resetMemoryRateLimitStoreForTests();
    if (previous === undefined) delete process.env.RATE_LIMIT_STORE;
    else process.env.RATE_LIMIT_STORE = previous;
  }
});

test('vote resolution handles empty options, invalid expiry, and deterministic ties', () => {
  assert.equal(getVoteExpiry({ expiresAt: 'not-a-date' }), null);
  assert.equal(getVoteExpiry({}), null);
  assert.equal(selectWinningOption([], () => 0), null);

  const options = [
    { optionId: 'a', restaurantId: 'r1', count: 2 },
    { optionId: 'b', restaurantId: 'r2', count: 2 },
    { optionId: 'c', restaurantId: 'r3', count: 1 },
  ];

  assert.deepEqual(selectWinningOption(options, () => 0), options[0]);
  assert.deepEqual(selectWinningOption(options, () => 0.99), options[1]);
});

test('vote GET is read-only and clients explicitly resolve an expired vote', () => {
  const voteRoute = readFileSync(join(root, 'app/api/vote/[decisionId]/route.ts'), 'utf8');
  const getHandler = voteRoute.split('export async function POST')[0];
  const webClient = readFileSync(join(root, 'components/VotePageClient.tsx'), 'utf8');
  const mobileClient = readFileSync(join(root, 'mobile/src/screens/VoteScreen.js'), 'utf8');

  assert.doesNotMatch(getHandler, /lunchDecision\.update/);
  assert.match(
    readFileSync(join(root, 'app/api/vote/[decisionId]/resolve/route.ts'), 'utf8'),
    /export async function POST/,
  );
  assert.match(webClient, /\/resolve/);
  assert.match(mobileClient, /\/resolve/);
});

test('ratings GET scopes access with one membership query instead of per-rating checks', () => {
  const ratingsRoute = readFileSync(join(root, 'app/api/ratings/route.ts'), 'utf8');
  const getHandler = ratingsRoute.split('export async function GET')[1];

  assert.match(getHandler, /groupMember\.findMany/);
  assert.match(getHandler, /restaurant:\s*\{\s*groupId:\s*\{\s*in:/s);
  assert.doesNotMatch(getHandler, /ratings\.map\(async/);
});

test('email verification gates normal login and redirects new web accounts to verification UI', () => {
  const loginRoute = readFileSync(join(root, 'app/api/auth/login/route.ts'), 'utf8');
  const tokenRoute = readFileSync(join(root, 'app/api/auth/token/route.ts'), 'utf8');
  const registerClient = readFileSync(join(root, 'components/RegisterPageClient.tsx'), 'utf8');
  const session = readFileSync(join(root, 'lib/session.ts'), 'utf8');

  assert.match(loginRoute, /user\.emailVerified/);
  assert.match(tokenRoute, /user\.emailVerified/);
  assert.match(registerClient, /requiresVerification/);
  assert.match(registerClient, /\/settings\/profile/);
  assert.match(session, /emailVerified:\s*true/);
});
