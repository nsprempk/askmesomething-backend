import multer from "multer";
import path from "path";
import fs from "fs";

// ==========================================
// UPLOAD DIRECTORIES
// ==========================================

const uploadDirectory = path.join(process.cwd(), "uploads");

const imageDirectory = path.join(uploadDirectory, "images");
const audioDirectory = path.join(uploadDirectory, "audio");

// Create directories if they don't exist
fs.mkdirSync(imageDirectory, {
  recursive: true,
});

fs.mkdirSync(audioDirectory, {
  recursive: true,
});

// ==========================================
// SAFE UNIQUE FILENAME
// ==========================================

const createSafeFilename = (extension) => {
  const timestamp = Date.now();
  const randomPart = `${Math.random().toString(36).slice(2)}${Math.random()
    .toString(36)
    .slice(2)}`;

  return `${timestamp}-${randomPart}${extension}`;
};

// ==========================================
// IMAGE MIME TYPES
// ==========================================

const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const allowedImageTypes = new Set(Object.keys(imageExtensions));

// ==========================================
// AUDIO MIME TYPES
// ==========================================

const audioExtensions = {
  "audio/webm": ".webm",
  "audio/ogg": ".ogg",
  "audio/mp4": ".mp4",
  "audio/m4a": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/aac": ".aac",
  "audio/x-aac": ".aac",
  "audio/flac": ".flac",
};

const allowedAudioTypes = new Set(Object.keys(audioExtensions));

// ==========================================
// IMAGE STORAGE
// ==========================================

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDirectory);
  },

  filename: (req, file, cb) => {
    const mimeType = (file.mimetype || "").split(";")[0].trim().toLowerCase();

    const extension = imageExtensions[mimeType];

    if (!extension) {
      return cb(new Error("Invalid image format."));
    }

    cb(null, createSafeFilename(extension));
  },
});

// ==========================================
// AUDIO STORAGE
// ==========================================

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, audioDirectory);
  },

  filename: (req, file, cb) => {
    const mimeType = (file.mimetype || "").split(";")[0].trim().toLowerCase();

    const extension = audioExtensions[mimeType];

    if (!extension) {
      return cb(new Error("Invalid audio format."));
    }

    cb(null, createSafeFilename(extension));
  },
});

// ==========================================
// IMAGE FILTER
// ==========================================

const imageFileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || "").split(";")[0].trim().toLowerCase();

  if (file.fieldname !== "image") {
    return cb(
      new Error("Invalid image field. Expected field name: image."),
      false,
    );
  }

  if (!allowedImageTypes.has(mimeType)) {
    return cb(
      new Error("Unsupported image format. Allowed: JPG, PNG and WEBP."),
      false,
    );
  }

  cb(null, true);
};

// ==========================================
// AUDIO FILTER
// ==========================================

const audioFileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || "").split(";")[0].trim().toLowerCase();

  if (file.fieldname !== "audio") {
    return cb(
      new Error("Invalid audio field. Expected field name: audio."),
      false,
    );
  }

  if (!allowedAudioTypes.has(mimeType)) {
    return cb(new Error("Unsupported audio format."), false);
  }

  cb(null, true);
};

// ==========================================
// IMAGE UPLOAD
// ==========================================

export const uploadImage = multer({
  storage: imageStorage,

  limits: {
    // 5 MB maximum
    fileSize: 5 * 1024 * 1024,

    // Only one file
    files: 1,

    // Prevent excessive multipart fields
    fields: 10,

    // Prevent excessively large field names
    fieldNameSize: 100,

    // Prevent excessively large field values
    fieldSize: 100 * 1024,
  },

  fileFilter: imageFileFilter,
});

// ==========================================
// AUDIO UPLOAD
// ==========================================

export const uploadAudio = multer({
  storage: audioStorage,

  limits: {
    // 10 MB maximum
    fileSize: 10 * 1024 * 1024,

    // Only one file
    files: 1,

    // Prevent excessive multipart fields
    fields: 10,

    fieldNameSize: 100,

    fieldSize: 100 * 1024,
  },

  fileFilter: audioFileFilter,
});
