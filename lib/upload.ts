/**
 * Local-filesystem image upload helper for VPS deployment.
 *
 * Uploads are stored at /public/uploads/<type>/<uuid>.jpg and served by
 * Next.js at https://<host>/uploads/<type>/<uuid>.jpg.
 *
 * All images are auto-resized and converted to JPEG via `jimp`
 * (pure JavaScript, no native/CPU-specific binaries) so the app runs on
 * any VPS, including older CPUs that can't use sharp's prebuilt linux-x64
 * binaries.
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Jimp } from 'jimp';
import { MAX_FILE_SIZE } from '@/lib/upload-constants';

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

// HEIC/HEIF requires libheif; jimp can't decode it in pure JS. If users
// need HEIC uploads later, convert client-side before upload.
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

  // jimp v1 API: use Jimp.fromBuffer for in-memory images.
  // (Jimp.read is for file paths / URLs in v1.)
  const image = await Jimp.fromBuffer(bytes);

  if (config.square) {
    image.cover({ w: config.maxWidth, h: config.maxWidth });
  } else if (image.width > config.maxWidth) {
    image.resize({ w: config.maxWidth });
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
