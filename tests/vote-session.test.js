require('sucrase/register/ts');

const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const {
  findActiveGroupVote,
  getVoteStartResponse,
} = require('../lib/vote-session.ts');

const root = join(__dirname, '..');

test('findActiveGroupVote returns the newest unexpired group vote', async () => {
  const now = new Date('2026-06-28T12:00:00.000Z');
  const calls = [];
  const prisma = {
    lunchDecision: {
      async findMany(args) {
        calls.push(args);
        return [
          {
            id: 'expired-vote',
            constraintsUsed: { expiresAt: '2026-06-28T11:59:00.000Z' },
          },
          {
            id: 'active-vote',
            constraintsUsed: { expiresAt: '2026-06-28T12:10:00.000Z' },
          },
        ];
      },
    },
  };

  const vote = await findActiveGroupVote(prisma, 'group-1', now);

  assert.equal(vote?.id, 'active-vote');
  assert.deepEqual(calls[0].where, {
    groupId: 'group-1',
    modeUsed: 'we_fight',
    chosenRestaurantId: null,
  });
  assert.deepEqual(getVoteStartResponse(vote), {
    success: true,
    decisionId: 'active-vote',
    expiresAt: '2026-06-28T12:10:00.000Z',
    reused: true,
  });
});

test('findActiveGroupVote ignores expired votes and malformed expiry data', async () => {
  const prisma = {
    lunchDecision: {
      async findMany() {
        return [
          { id: 'bad-expiry', constraintsUsed: { expiresAt: 'not-a-date' } },
          { id: 'expired-vote', constraintsUsed: { expiresAt: '2026-06-28T11:00:00.000Z' } },
        ];
      },
    },
  };

  const vote = await findActiveGroupVote(prisma, 'group-1', new Date('2026-06-28T12:00:00.000Z'));

  assert.equal(vote, null);
});

test('vote invite links can open an existing group decision', () => {
  const voteStartRoute = readFileSync(join(root, 'app/api/vote/start/route.ts'), 'utf8');
  const dynamicVotePage = join(root, 'app/group/[groupId]/vote/[decisionId]/page.tsx');

  assert.match(voteStartRoute, /\/group\/\$\{groupId\}\/vote\/\$\{decision\.id\}/);
  assert.equal(existsSync(dynamicVotePage), true);
  assert.match(readFileSync(dynamicVotePage, 'utf8'), /initialDecisionId/);
});

test('vote sharing uses the live decision link instead of a fresh start link', () => {
  const webClient = readFileSync(join(root, 'components/VotePageClient.tsx'), 'utf8');

  assert.match(webClient, /const voteUrl = decisionId/);
  assert.match(webClient, /\/vote\/\$\{decisionId\}/);
  assert.match(webClient, /value=\{voteUrl\}/);
  assert.match(webClient, /writeText\(voteUrl\)/);
});

test('vote UI does not mark one option as leading when top votes are tied', () => {
  const webClient = readFileSync(join(root, 'components/VotePageClient.tsx'), 'utf8');

  assert.match(webClient, /const topOptions = options\.filter/);
  assert.match(webClient, /topOptions\.length === 1/);
});
