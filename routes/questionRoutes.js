import express from "express";

import {
  askQuestion,
  askImageQuestion,
  askVoiceQuestion,
  getQuestionById,
} from "../controllers/questionController.js";

import { protect } from "../middleware/authMiddleware.js";

import { uploadImage, uploadAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ==========================================
// TEXT QUESTION
// ==========================================

router.post("/", protect, askQuestion);

// ==========================================
// IMAGE QUESTION
// ==========================================

router.post("/image", protect, uploadImage.single("image"), askImageQuestion);

// ==========================================
// VOICE QUESTION
// ==========================================

router.post("/voice", protect, uploadAudio.single("audio"), askVoiceQuestion);

// ==========================================
// GET QUESTION
// ==========================================

router.get("/:id", protect, getQuestionById);

export default router;
