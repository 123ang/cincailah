/**
 * Shared upload limits (safe to import from Client Components).
 *
 * Keep this file free of Node-only imports (fs, jimp, etc.).
 */

/** Hard cap for multipart image uploads (restaurant / avatar / group cover). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
