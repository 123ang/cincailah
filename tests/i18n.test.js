require('sucrase/register/ts');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { translate } = require('../lib/i18n.ts');
const { ms } = require('../lib/locales/ms.ts');
const { zh } = require('../lib/locales/zh.ts');

const root = path.resolve(__dirname, '..');

function literalKeys() {
  const files = fs.readdirSync(path.join(root, 'components'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => path.join(root, 'components', f))
    .concat(path.join(root, 'lib/utils.ts'));
  const keys = new Set();
  const pattern = /\bt\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
  for (const file of files) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(pattern)) {
      keys.add(match[2].replace(/\\'/g, "'"));
    }
  }
  return [...keys];
}

test('every literal t() string has a Malay and Chinese translation', () => {
  const keys = literalKeys();
  assert.ok(keys.length > 200);
  assert.deepEqual(keys.filter((k) => !(k in ms)), [], 'missing in ms');
  assert.deepEqual(keys.filter((k) => !(k in zh)), [], 'missing in zh');
});

test('translations keep the same {placeholders} as the English text', () => {
  const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
  for (const dict of [ms, zh]) {
    for (const [en, value] of Object.entries(dict)) {
      assert.equal(vars(value), vars(en), en);
    }
  }
});

test('translate interpolates and falls back to English', () => {
  assert.equal(translate('ms', '{count} members', { count: 3 }), '3 ahli');
  assert.equal(translate('zh', 'Tap once to decide'), '点一下就决定');
  assert.equal(translate('ms', 'Not a real key'), 'Not a real key');
  assert.equal(translate('en', '{count} votes', { count: 2 }), '2 votes');
});
