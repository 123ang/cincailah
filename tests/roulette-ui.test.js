const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('web roulette reveals the winner inline with the wheel', () => {
  const source = read('components/RouletteSpinner.tsx');

  assert.match(source, /The needle says/);
  assert.match(source, /Spin again/);
  assert.doesNotMatch(source, /The boss has spoken/);
});

test('mobile winner screen uses the logo roulette reveal', () => {
  const source = read('mobile/src/screens/WinnerScreen.js');

  assert.match(source, /LOGO/);
  assert.match(source, /The needle says/);
  assert.match(source, /Spin again/);
  assert.doesNotMatch(source, /The boss has spoken/);
});
