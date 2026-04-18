/**
 * POST /api/upload
 * Accepts multipart/form-data with `file` and `type` ("restaurant" | "avatar" | "group_cover").
 *
 * Validates auth, file size/MIME, resizes via jimp, writes to /public/uploads/<type>/.
 * Returns { url, bytes, filename }.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveUserId } from '@/lib/session';
import { saveUpload, MAX_FILE_SIZE, type UploadType } from '@/lib/upload';
import { rateLimit, getClientIp } from '@/lib/ratelimit';
import { logRequest, logger, reportError } from '@/lib/logger';

// Raise body size limit for this route (Next 15 app router respects this)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TYPES: UploadType[] = ['restaurant', 'avatar', 'group_cover'];

export async function POST(request: NextRequest) {
  logRequest(request, { endpoint: 'upload' });

  const ip = getClientIp(request);
  const rl = rateLimit(`upload:${ip}`, 20); // 20 uploads/min/IP
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many uploads. Please slow down.' },
      { status: 429 }
    );
  }

  const userId = await resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    const typeRaw = form.get('type');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (typeof typeRaw !== 'string' || !VALID_TYPES.includes(typeRaw as UploadType)) {
      return NextResponse.json(
        { error: `Invalid type (must be one of: ${VALID_TYPES.join(', ')})` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)` },
        { status: 413 }
      );
    }

    const result = await saveUpload(file, typeRaw as UploadType);

    logger.info(
      {
        userId,
        type: typeRaw,
        bytes: result.bytes,
        filename: result.filename,
      },
      'image uploaded'
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Upload failed';
    reportError(error, { route: 'upload', userId });
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
