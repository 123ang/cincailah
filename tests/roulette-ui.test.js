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

test('landing page shows an interactive logo roulette preview', () => {
  const source = read('components/LandingPageClient.tsx');

  assert.match(source, /LogoRoulettePreview/);
  assert.match(source, /The needle says/);
  assert.match(source, /Spin again/);
  assert.match(source, /Try Solo/);
  assert.match(source, /previewWheelTokens/);
  assert.doesNotMatch(source, /Try solo spin/);
});

test('auth pages use the new logo brand header', () => {
  const login = read('components/LoginPageClient.tsx');
  const register = read('components/RegisterPageClient.tsx');
  const forgot = read('components/ForgotPasswordClient.tsx');
  const reset = read('components/ResetPasswordClient.tsx');
  const header = read('components/AuthBrandHeader.tsx');

  for (const source of [login, register, forgot, reset]) {
    assert.match(source, /AuthBrandHeader/);
    assert.doesNotMatch(source, /🍛/);
  }
  assert.match(header, /\/brand\/cincailah-logo\.jpeg/);
  assert.match(header, /makan roulette/);
});

test('public website pages share the same branded navbar', () => {
  const nav = read('components/PublicSiteNav.tsx');
  const landing = read('components/LandingPageClient.tsx');
  const solo = read('components/SoloPage.tsx');
  const login = read('components/LoginPageClient.tsx');
  const register = read('components/RegisterPageClient.tsx');
  const forgot = read('components/ForgotPasswordClient.tsx');
  const reset = read('components/ResetPasswordClient.tsx');
  const about = read('app/about/page.tsx');
  const privacy = read('app/privacy/page.tsx');
  const terms = read('app/terms/page.tsx');

  assert.match(nav, /aria-label="Primary navigation"/);
  assert.match(nav, /\/brand\/cincailah-logo\.jpeg/);
  assert.match(nav, /DarkModeToggle/);
  assert.match(nav, /makan roulette/);

  for (const source of [landing, solo, login, register, forgot, reset, about, privacy, terms]) {
    assert.match(source, /PublicSiteNav/);
  }
});

test('solo page uses the logo roulette result design', () => {
  const source = read('components/SoloPage.tsx');

  assert.match(source, /Solo food roulette/);
  assert.match(source, /The needle says/);
  assert.match(source, /logo-preview-wheel/);
  assert.match(source, /Spin again/);
  assert.match(source, /PublicSiteNav/);
  assert.match(source, /soloWheelTokens/);
});

test('service worker is disabled in development to avoid stale previews', () => {
  const source = read('components/ServiceWorkerRegister.tsx');

  assert.match(source, /NODE_ENV !== 'production'/);
  assert.match(source, /getRegistrations/);
  assert.match(source, /caches\.keys/);
});

test('server logger avoids worker transports in Next route handlers', () => {
  const source = read('lib/logger.ts');

  assert.doesNotMatch(source, /transport:\s*{/);
  assert.doesNotMatch(source, /pino-pretty/);
});

test('root layout does not depend on remote Google font fetches', () => {
  const source = read('app/layout.tsx');

  assert.doesNotMatch(source, /next\/font\/google/);
  assert.doesNotMatch(source, /Inter\(/);
});
