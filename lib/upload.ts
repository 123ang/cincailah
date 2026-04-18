/**
 * Local-filesystem image upload helper for VPS deployment.
 *
 * Uploads are stored at /public/uploads/<type>/<uuid>.jpg and served by
 * Next.js at https://<host>/uploads/<type>/<uuid>.jpg.
 *
 * All images are auto-resized and converted to JPEG via `jimp`
 * (pure JavaScript, no native/CPU-specific binaries) so the app runs on
 * any VPS including older CPUs that can't use sharp's prebuilt linux-x64
 * binaries.
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { MAX_FILE_SIZE } from '@/lib/upload-constants';

type JimpModule = typeof import('jimp');
let jimpSingleton: JimpModule | null = null;

async function loadJimp(): Promise<JimpModule> {
  if (jimpSingleton) return jimpSingleton;
  const mod = (await import('jimp')) as unknown as JimpModule;
  jimpSingleton = mod;
  return jimpSingleton;
}

export type UploadType = 'restaurant' | 'avatar' | 'group_cover';

const TYPE_DIRS: Record<UploadType, string> = {
  restaurant: 'restaurants',
  avatar: 'avatars',
  group_cover: 'group-covers',
};

const TYPE_CONFIG: Record<UploadType, { maxWidth: number; square: boolean; quality: number }> = {
  restaurant: { maxWidth: 1200, square: false, quality: 82 },
  avatar: { maxWidth: 400, square: true, quality: 85 },
  group_cover: { maxWidth: 1600, square: false, quality: 82 },
};

export { MAX_FILE_SIZE };

// HEIC/HEIF requires libheif; jimp can't decode it in pure JS. If users need
// HEIC uploads later, convert client-side before upload or add a native
// decoder. For now we accept the common web formats.
export const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
]);

export interface UploadResult {
  url: string;
  filename: string;
  bytes: number;
}

function getJimpRead(mod: JimpModule): (buf: Buffer) => Promise<unknown> {
  const candidate =
    (mod as unknown as { Jimp?: { read?: unknown }; read?: unknown }).Jimp?.read ??
    (mod as unknown as { read?: unknown }).read ??
    (mod as unknown as { default?: { read?: unknown } }).default?.read;
  if (typeof candidate !== 'function') {
    throw new Error('jimp module did not expose read()');
  }
  return candidate as (buf: Buffer) => Promise<unknown>;
}

/**
 * Process & save an uploaded image to disk.
 * Returns the public URL path to store in the database.
 */
export async function saveUpload(file: File, type: UploadType): Promise<UploadResult> {
  if (!ALLOWED_MIMES.has(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`);
  }
  if (file.size === 0) {
    throw new Error('Empty file');
  }

  const config = TYPE_CONFIG[type];
  const subdir = TYPE_DIRS[type];
  const bytes = Buffer.from(await file.arrayBuffer());

  const jimpMod = await loadJimp();
  const read = getJimpRead(jimpMod);
  const image = (await read(bytes)) as {
    width: number;
    height: number;
    resize: (opts: { w: number; h?: number } | { w: number; h: number }) => unknown;
    cover: (opts: { w: number; h: number }) => unknown;
    quality?: (q: number) => unknown;
    getBuffer: (mime: string, opts?: { quality?: number }) => Promise<Buffer>;
  };

  if (config.square) {
    // Crop to square, centered.
    (image as { cover: (o: { w: number; h: number }) => unknown }).cover({
      w: config.maxWidth,
      h: config.maxWidth,
    });
  } else {
    const w = image.width;
    if (w > config.maxWidth) {
      (image as { resize: (o: { w: number }) => unknown }).resize({ w: config.maxWidth });
    }
  }

  const processed = await image.getBuffer('image/jpeg', { quality: config.quality });

  const filename = `${randomUUID()}.jpg`;
  const dir = path.join(process.cwd(), 'public', 'uploads', subdir);
  await mkdir(dir, { recursive: true });
  const fullPath = path.join(dir, filename);
  await writeFile(fullPath, processed);

  return {
    url: `/uploads/${subdir}/${filename}`,
    filename,
    bytes: processed.length,
  };
}

/**
 * Delete a previously-uploaded file by its public URL path.
 * Safe: only deletes files under /public/uploads/.
 */
export async function deleteUpload(publicUrl: string | null | undefined): Promise<void> {
  if (!publicUrl || !publicUrl.startsWith('/uploads/')) return;
  try {
    const { unlink } = await import('fs/promises');
    const rel = publicUrl.replace(/^\/+/, '');
    const fullPath = path.join(process.cwd(), 'public', rel);
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    if (!path.resolve(fullPath).startsWith(path.resolve(uploadsRoot))) return;
    await unlink(fullPath);
  } catch {
    // best-effort cleanup — ignore missing files
  }
}
