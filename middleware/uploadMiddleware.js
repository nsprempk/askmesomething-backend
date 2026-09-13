import multer from "multer";
import path from "path";
import fs from "fs";

// ==========================================
// UPLOAD DIRECTORIES
// ==========================================

const uploadDirectory = path.join(process.cwd(), "uploads");

const imageDirectory = path.join(uploadDirectory, "images");
const audioDirectory = path.join(uploadDirectory, "audio");

if (!fs.existsSync(imageDirectory)) {
  fs.mkdirSync(imageDirectory, {
    recursive: true,
  });
}

if (!fs.existsSync(audioDirectory)) {
  fs.mkdirSync(audioDirectory, {
    recursive: true,
  });
}

// ==========================================
// IMAGE STORAGE
// ==========================================

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDirectory);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname) || ".jpg";

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
    const mimeType = (file.mimetype || "").split(";")[0].trim();

    let extension = path.extname(file.originalname);

    if (!extension) {
      const extensionMap = {
        "audio/webm": ".webm",
        "audio/mp4": ".mp4",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/aac": ".aac",
        "audio/x-m4a": ".m4a",
      };

      extension = extensionMap[mimeType] || ".webm";
    }

    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9,
    )}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// IMAGE FILTER
// ==========================================

const allowedImageTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const imageFileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || "").split(";")[0].trim();

  console.log("=================================");
  console.log("IMAGE UPLOAD");
  console.log("Field:", file.fieldname);
  console.log("Name:", file.originalname);
  console.log("MIME:", file.mimetype);
  console.log("Normalized MIME:", mimeType);
  console.log("=================================");

  if (allowedImageTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Unsupported image format: ${file.mimetype || "unknown"}`),
      false,
    );
  }
};

// ==========================================
// AUDIO FILTER
// ==========================================

const allowedAudioTypes = [
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/aac",
  "audio/x-m4a",
];

const audioFileFilter = (req, file, cb) => {
  const mimeType = (file.mimetype || "").split(";")[0].trim();

  console.log("=================================");
  console.log("AUDIO UPLOAD");
  console.log("Field:", file.fieldname);
  console.log("Name:", file.originalname);
  console.log("MIME:", file.mimetype);
  console.log("Normalized MIME:", mimeType);
  console.log("=================================");

  if (allowedAudioTypes.includes(mimeType)) {
    cb(null, true);
  } else {
    cb(
      new Error(`Unsupported audio format: ${file.mimetype || "unknown"}`),
      false,
    );
  }
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
