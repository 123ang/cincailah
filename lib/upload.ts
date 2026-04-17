/**
 * Local-filesystem image upload helper for VPS deployment.
 *
 * Uploads are stored at /public/uploads/<type>/<uuid>.webp and served by
 * Next.js at https://<host>/uploads/<type>/<uuid>.webp.
 *
 * All images are auto-resized to max 1200px wide and converted to WebP
 * via `sharp` for consistent quality + small file size.
 */

import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export type UploadType = 'restaurant' | 'avatar' | 'group_cover';

const TYPE_DIRS: Record<UploadType, string> = {
  restaurant: 'restaurants',
  avatar: 'avatars',
  group_cover: 'group-covers',
};

// Max dimensions by type (avatars square-cropped, others preserve aspect)
const TYPE_CONFIG: Record<UploadType, { maxWidth: number; square: boolean; quality: number }> = {
  restaurant: { maxWidth: 1200, square: false, quality: 82 },
  avatar: { maxWidth: 400, square: true, quality: 85 },
  group_cover: { maxWidth: 1600, square: false, quality: 82 },
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export interface UploadResult {
  url: string;   // public URL path, e.g. /uploads/restaurants/abc.webp
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

  // Process image with sharp
  let pipeline = sharp(bytes, { failOn: 'error' }).rotate(); // respect EXIF orientation

  if (config.square) {
    pipeline = pipeline.resize(config.maxWidth, config.maxWidth, {
      fit: 'cover',
      position: 'attention',
    });
  } else {
    pipeline = pipeline.resize(config.maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const processed = await pipeline.webp({ quality: config.quality }).toBuffer();

  // Save to /public/uploads/<type>/<uuid>.webp
  const filename = `${randomUUID()}.webp`;
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
    // Safety: path must resolve inside /public/uploads
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    if (!path.resolve(fullPath).startsWith(path.resolve(uploadsRoot))) return;
    await unlink(fullPath);
  } catch {
    // best-effort cleanup — ignore missing files
  }
}
