import fs from "fs";

import Question from "../models/Question.js";
import Category from "../models/Category.js";

import generateAnswer from "../services/aiService.js";
import generateImageAnswer from "../services/imageService.js";
import transcribeAudio from "../services/speechService.js";

// ==========================================
// CONSTANTS
// ==========================================

const MAX_TEXT_QUESTION_LENGTH = 5000;

const ALLOWED_QUESTION_TYPES = ["text"];

// ==========================================
// HELPER: VALIDATE OBJECT ID
// ==========================================

const isValidObjectId = (id) => {
  return /^[a-fA-F0-9]{24}$/.test(String(id));
};

// ==========================================
// HELPER: DELETE FILE SAFELY
// ==========================================

const deleteFileSafely = (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Unable to delete uploaded file:", error.message);
  }
};

// =========================
// TEXT QUESTION
// =========================

export const askQuestion = async (req, res, next) => {
  try {
    const { question, categoryId, type = "text" } = req.body;

    // ==========================================
    // VALIDATE QUESTION
    // ==========================================

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const cleanQuestion = question.trim();

    if (cleanQuestion.length > MAX_TEXT_QUESTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Question cannot exceed ${MAX_TEXT_QUESTION_LENGTH} characters.`,
      });
    }

    // ==========================================
    // VALIDATE TYPE
    // ==========================================

    if (!ALLOWED_QUESTION_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type.",
      });
    }

    // ==========================================
    // VALIDATE CATEGORY
    // ==========================================

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!isValidObjectId(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category.",
      });
    }

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ==========================================
    // CREATE QUESTION
    // ==========================================

    const questionRecord = await Question.create({
      user: req.user._id,
      category: category._id,
      type: "text",
      question: cleanQuestion,
      status: "processing",
    });

    try {
      // ==========================================
      // GENERATE AI ANSWER
      // ==========================================

      const answer = await generateAnswer({
        question: cleanQuestion,
        category,
      });

      questionRecord.answer = answer;
      questionRecord.status = "completed";

      await questionRecord.save();

      return res.status(200).json({
        success: true,
        message: "Answer generated successfully.",
        question: questionRecord,
      });
    } catch (aiError) {
      questionRecord.status = "failed";

      // Don't expose/store unnecessary internal details.
      questionRecord.errorMessage = "AI request failed.";

      await questionRecord.save();

      throw aiError;
    }
  } catch (error) {
    next(error);
  }
};

// =========================
// IMAGE QUESTION
// =========================

export const askImageQuestion = async (req, res, next) => {
  let questionRecord = null;

  try {
    const { categoryId } = req.body;

    // ==========================================
    // VALIDATE IMAGE
    // ==========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // ==========================================
    // VALIDATE CATEGORY
    // ==========================================

    if (!categoryId) {
      deleteFileSafely(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!isValidObjectId(categoryId)) {
      deleteFileSafely(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Invalid category.",
      });
    }

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      deleteFileSafely(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ==========================================
    // CREATE RECORD
    // ==========================================

    questionRecord = await Question.create({
      user: req.user._id,
      category: category._id,
      type: "image",
      question: `Image question: ${req.file.originalname}`,
      imagePath: `/uploads/images/${req.file.filename}`,
      status: "processing",
    });

    try {
      // ==========================================
      // GENERATE IMAGE ANSWER
      // ==========================================

      const answer = await generateImageAnswer({
        file: req.file,
        category,
      });

      questionRecord.answer = answer;
      questionRecord.status = "completed";

      await questionRecord.save();

      return res.status(200).json({
        success: true,
        message: "Image answer generated successfully.",
        question: questionRecord,
      });
    } catch (aiError) {
      questionRecord.status = "failed";
      questionRecord.errorMessage = "AI image request failed.";

      await questionRecord.save();

      throw aiError;
    }
  } catch (error) {
    next(error);
  }
};

// =========================
// VOICE QUESTION
// =========================

export const askVoiceQuestion = async (req, res, next) => {
  let questionRecord = null;

  try {
    const { categoryId } = req.body;

    // ==========================================
    // VALIDATE AUDIO
    // ==========================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Audio file was not received by the server. Please record again.",
      });
    }

    // ==========================================
    // VALIDATE CATEGORY
    // ==========================================

    if (!categoryId) {
      deleteFileSafely(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (!isValidObjectId(categoryId)) {
      deleteFileSafely(req.file.path);

      return res.status(400).json({
        success: false,
        message: "Invalid category.",
      });
    }

    // ==========================================
    // FIND CATEGORY
    // ==========================================

    const category = await Category.findOne({
      _id: categoryId,
      isActive: true,
    });

    if (!category) {
      deleteFileSafely(req.file.path);

      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    // ==========================================
    // CREATE QUESTION RECORD
    // ==========================================

    questionRecord = await Question.create({
      user: req.user._id,
      category: category._id,
      type: "voice",
      question: "Voice question",
      audioPath: `/uploads/audio/${req.file.filename}`,
      status: "processing",
    });

    try {
      // ==========================================
      // TRANSCRIBE AUDIO
      // ==========================================

      const transcription = await transcribeAudio(req.file);

      if (!transcription || !transcription.trim()) {
        throw new Error("Unable to understand the audio recording.");
      }

      const cleanTranscription = transcription.trim();

      // Prevent excessively large transcriptions.
      if (cleanTranscription.length > MAX_TEXT_QUESTION_LENGTH) {
        throw new Error("The transcribed question is too long.");
      }

      questionRecord.transcription = cleanTranscription;
      questionRecord.question = cleanTranscription;

      await questionRecord.save();

      // ==========================================
      // GENERATE AI ANSWER
      // ==========================================

      const answer = await generateAnswer({
        question: cleanTranscription,
        category,
      });

      questionRecord.answer = answer;
      questionRecord.status = "completed";

      await questionRecord.save();

      // ==========================================
      // SUCCESS
      // ==========================================

      return res.status(200).json({
        success: true,
        message: "Voice answer generated successfully.",
        question: questionRecord,
      });
    } catch (processingError) {
      console.error("Voice processing error:", processingError);

      questionRecord.status = "failed";
      questionRecord.errorMessage = "Voice processing failed.";

      await questionRecord.save();

      throw processingError;
    }
  } catch (error) {
    console.error("Voice question error:", error);

    next(error);
  }
};

// =========================
// GET QUESTION
// =========================

export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // ==========================================
    // VALIDATE QUESTION ID
    // ==========================================

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    // ==========================================
    // IMPORTANT SECURITY CHECK
    // ==========================================
    // The question MUST belong to the
    // currently authenticated user.
    // ==========================================

    const question = await Question.findOne({
      _id: id,
      user: req.user._id,
    }).populate("category", "name slug icon description");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    next(error);
  }
};
