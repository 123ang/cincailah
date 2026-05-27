const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

test('EAS production builds disable Sentry uploads until Sentry release config exists', () => {
  const eas = readJson('mobile/eas.json');
  const env = eas.build?.production?.env;

  assert.equal(env?.SENTRY_DISABLE_AUTO_UPLOAD, 'true');
  assert.equal(env?.SENTRY_DISABLE_NATIVE_DEBUG_UPLOAD, 'true');
});

test('EAS iOS submit config never keeps a placeholder App Store Connect app ID', () => {
  const eas = readJson('mobile/eas.json');
  const ascAppId = eas.submit?.production?.ios?.ascAppId;

  assert.ok(
    ascAppId === undefined || /^\d+$/.test(ascAppId),
    'ascAppId must be omitted or set to the real numeric App Store Connect app ID'
  );
});
