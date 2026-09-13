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
// IMAGE STORAGE
// ==========================================

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
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

    const extensionMap = {
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

    let extension = path.extname(file.originalname).toLowerCase();

    if (!extension || extension === ".") {
      extension = extensionMap[mimeType] || ".webm";
    }

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// IMAGE MIME TYPES
// ==========================================

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

// ==========================================
// AUDIO MIME TYPES
// ==========================================

const allowedAudioTypes = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/aac",
  "audio/x-aac",
  "audio/flac",
]);

// ==========================================
// IMAGE FILTER
// ==========================================

const imageFileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || "").split(";")[0].trim().toLowerCase();

  console.log("=================================");
  console.log("IMAGE UPLOAD");
  console.log("Field:", file.fieldname);
  console.log("Name:", file.originalname);
  console.log("MIME:", file.mimetype);
  console.log("Normalized MIME:", mimeType);
  console.log("=================================");

  if (file.fieldname !== "image") {
    return cb(
      new Error("Invalid image field. Expected field name: image"),
      false,
    );
  }

  if (!allowedImageTypes.has(mimeType)) {
    return cb(
      new Error(`Unsupported image format: ${file.mimetype || "unknown"}`),
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

  console.log("=================================");
  console.log("AUDIO UPLOAD");
  console.log("Field:", file.fieldname);
  console.log("Name:", file.originalname);
  console.log("MIME:", file.mimetype);
  console.log("Normalized MIME:", mimeType);
  console.log("=================================");

  if (file.fieldname !== "audio") {
    return cb(
      new Error("Invalid audio field. Expected field name: audio"),
      false,
    );
  }

  if (!allowedAudioTypes.has(mimeType)) {
    return cb(
      new Error(`Unsupported audio format: ${file.mimetype || "unknown"}`),
      false,
    );
  }

  cb(null, true);
};

// ==========================================
// IMAGE UPLOAD
// ==========================================

export const uploadImage = multer({
  storage: imageStorage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: imageFileFilter,
});

// ==========================================
// AUDIO UPLOAD
// ==========================================

export const uploadAudio = multer({
  storage: audioStorage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: audioFileFilter,
});
