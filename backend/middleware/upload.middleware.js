/**
 * middleware/upload.middleware.js
 * Handles the actual file coming from an <input type="file">.
 * Validates it's really an image (by MIME type, not just the file
 * extension — extensions are trivial to fake) and caps the size so
 * nobody can fill the disk with one "photo" upload.
 *
 * Saved files land in backend/uploads/ with a random-ish name (so
 * two people uploading "photo.jpg" don't overwrite each other) and
 * are served back out at /uploads/<filename> — see the static route
 * in server.js.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase();
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, `${randomName}${safeExt}`);
  }
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    return cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

/** Builds the public URL for an uploaded file, or null if none was sent. */
function uploadedFileUrl(req) {
  return req.file ? `/uploads/${req.file.filename}` : null;
}

module.exports = { upload, uploadedFileUrl, UPLOAD_DIR };
