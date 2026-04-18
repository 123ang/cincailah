/**
 * Ensure `sharp` can load on Linux hosts where the prebuilt linux-x64 binary
 * requires x86-64-v2 (common error on older VPS CPUs / certain VMs).
 *
 * Strategy:
 * 1) Try `require('sharp')` — fast path when prebuilt works.
 * 2) On Linux, retry with SHARP_FORCE_GLOBAL_LIBVIPS=1 (compile/use system libvips).
 * 3) If still failing, run `npm rebuild sharp --build-from-source` and retry (2).
 *
 * This script is intentionally defensive: it should never break installs on
 * macOS/Windows (it no-ops unless sharp fails to load on linux).
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require('node:child_process');

function tryRequireSharp(extraEnv) {
  const prevVals = new Map();
  for (const [k, v] of Object.entries(extraEnv)) {
    prevVals.set(k, process.env[k]);
    if (v === undefined || v === null) delete process.env[k];
    else process.env[k] = String(v);
  }
  try {
    // Clear require cache between attempts
    const key = require.resolve('sharp');
    delete require.cache[key];
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require('sharp');
  } catch (err) {
    return err;
  } finally {
    for (const [k, old] of prevVals.entries()) {
      if (old === undefined) delete process.env[k];
      else process.env[k] = old;
    }
  }
}

function isLinux() {
  return process.platform === 'linux';
}

function run(cmd, args, extraEnv) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: false,
  });
  return res.status === 0;
}

function main() {
  const first = tryRequireSharp({});
  if (!(first instanceof Error)) {
    process.exit(0);
  }

  if (!isLinux()) {
    // Non-linux: keep default install behavior / errors visible.
    console.error('[ensure-sharp] sharp failed to load on', process.platform);
    console.error(first);
    process.exit(0);
  }

  console.warn('[ensure-sharp] sharp prebuilt binary failed to load; attempting libvips rebuild path…');
  console.warn(String(first && first.message ? first.message : first));

  const second = tryRequireSharp({ SHARP_FORCE_GLOBAL_LIBVIPS: '1' });
  if (!(second instanceof Error)) {
    process.exit(0);
  }

  console.warn('[ensure-sharp] still failing; running: npm rebuild sharp --build-from-source');

  const ok = run(
    'npm',
    ['rebuild', 'sharp', '--build-from-source'],
    { SHARP_FORCE_GLOBAL_LIBVIPS: '1' }
  );
  if (!ok) {
    console.error('[ensure-sharp] npm rebuild sharp failed.');
    console.error(
      'Install build deps + libvips on Ubuntu, then re-run npm install:\n' +
        '  sudo apt install -y build-essential python3 pkg-config libvips-dev\n'
    );
    // Do not fail postinstall hard — let the project install complete, but sharp will break at runtime/build.
    process.exit(0);
  }

  const third = tryRequireSharp({ SHARP_FORCE_GLOBAL_LIBVIPS: '1' });
  if (third instanceof Error) {
    console.error('[ensure-sharp] sharp still fails after rebuild:');
    console.error(third);
    process.exit(0);
  }

  process.exit(0);
}

main();
