/**
 * Ensure `sharp` can load on Linux hosts where the prebuilt linux-x64 binary
 * targets newer CPU features than your VPS supports (common error:
 * "Prebuilt binaries for linux-x64 require v2 microarchitecture").
 *
 * Strategy (Linux only):
 * 1) If CPU flags look "too old" for the prebuilt sharp binary, skip trying it
 *    and go straight to a libvips-backed build: `npm rebuild sharp --build-from-source`
 *    with `SHARP_FORCE_GLOBAL_LIBVIPS=1`.
 * 2) Otherwise try `require('sharp')` (fast path).
 * 3) If that throws, run the same rebuild path as (1) and retry.
 *
 * Prereqs on Ubuntu VPS:
 *   sudo apt install -y build-essential python3 pkg-config libvips-dev
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');

function tryRequireSharp(extraEnv) {
  const prevVals = new Map();
  for (const [k, v] of Object.entries(extraEnv)) {
    prevVals.set(k, process.env[k]);
    if (v === undefined || v === null) delete process.env[k];
    else process.env[k] = String(v);
  }
  try {
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

function readCpuFlags() {
  try {
    const txt = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const m = txt.match(/^flags\s*:\s*(.+)$/m);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function cpuLooksTooOldForSharpPrebuilt() {
  const flags = readCpuFlags();
  if (!flags) return false;
  // Heuristic: sharp's linux-x64 prebuilds assume a relatively modern baseline.
  // Missing SSE4.2 is a strong signal of very old CPUs that won't match the prebuilt.
  if (!/\bsse4_2\b/i.test(flags)) return true;
  // Extra safety: AVX is commonly present on hosts where prebuilt SIMD paths are happy.
  if (!/\bavx\b/i.test(flags)) return true;
  return false;
}

function run(cmd, args, extraEnv) {
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
    shell: false,
  });
  return res.status === 0;
}

function rebuildSharpFromSource() {
  return run(
    'npm',
    ['rebuild', 'sharp', '--build-from-source'],
    { SHARP_FORCE_GLOBAL_LIBVIPS: '1' }
  );
}

function main() {
  if (!isLinux()) {
    const first = tryRequireSharp({});
    if (first instanceof Error) {
      console.error('[ensure-sharp] sharp failed to load on', process.platform);
      console.error(first);
    }
    process.exit(0);
  }

  const forceOldCpu = cpuLooksTooOldForSharpPrebuilt();
  if (forceOldCpu) {
    console.warn(
      '[ensure-sharp] Linux CPU flags look incompatible with sharp prebuilt linux-x64; forcing source build against system libvips…'
    );
    const ok = rebuildSharpFromSource();
    if (!ok) {
      console.error('[ensure-sharp] npm rebuild sharp failed.');
      console.error(
        'Install build deps + libvips on Ubuntu, then re-run npm install:\n' +
          '  sudo apt install -y build-essential python3 pkg-config libvips-dev\n'
      );
      process.exit(0);
    }

    const after = tryRequireSharp({ SHARP_FORCE_GLOBAL_LIBVIPS: '1' });
    if (after instanceof Error) {
      console.error('[ensure-sharp] sharp still fails after forced rebuild:');
      console.error(after);
    }
    process.exit(0);
  }

  const first = tryRequireSharp({});
  if (!(first instanceof Error)) {
    process.exit(0);
  }

  console.warn('[ensure-sharp] sharp failed to load; attempting libvips rebuild path…');
  console.warn(String(first && first.message ? first.message : first));

  const ok = rebuildSharpFromSource();
  if (!ok) {
    console.error('[ensure-sharp] npm rebuild sharp failed.');
    console.error(
      'Install build deps + libvips on Ubuntu, then re-run npm install:\n' +
        '  sudo apt install -y build-essential python3 pkg-config libvips-dev\n'
    );
    process.exit(0);
  }

  const second = tryRequireSharp({ SHARP_FORCE_GLOBAL_LIBVIPS: '1' });
  if (second instanceof Error) {
    console.error('[ensure-sharp] sharp still fails after rebuild:');
    console.error(second);
  }

  process.exit(0);
}

main();
