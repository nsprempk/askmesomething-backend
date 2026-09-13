import fs from "fs";

import Question from "../models/Question.js";
import Category from "../models/Category.js";

import generateAnswer from "../services/aiService.js";
import generateImageAnswer from "../services/imageService.js";
import transcribeAudio from "../services/speechService.js";

// =========================
// TEXT QUESTION
// =========================
export const askQuestion = async (req, res, next) => {
  try {
    const { question, categoryId, type = "text" } = req.body;

    // Validate question
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    // Validate category
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    // Find category
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

    // Create question
    const questionRecord = await Question.create({
      user: req.user._id,
      category: category._id,
      type,
      question: question.trim(),
      status: "processing",
    });

    try {
      // Generate AI answer
      const answer = await generateAnswer({
        question: question.trim(),
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

      questionRecord.errorMessage = aiError.message || "AI request failed.";

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

    // Validate image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Validate category
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    // Find category
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

    // Create record
    questionRecord = await Question.create({
      user: req.user._id,
      category: category._id,
      type: "image",
      question: `Image question: ${req.file.originalname}`,
      imagePath: `/uploads/images/${req.file.filename}`,
      status: "processing",
    });

    try {
      // Generate answer
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

      questionRecord.errorMessage =
        aiError.message || "AI image request failed.";

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
    console.log("=================================");
    console.log("VOICE CONTROLLER REACHED");
    console.log("=================================");
    console.log("Body:", req.body);
    console.log("File:", req.file);
    console.log("=================================");

    const { categoryId } = req.body;

    // ==========================================
    // VALIDATE AUDIO
    // ==========================================

    if (!req.file) {
      console.error("VOICE ERROR: req.file is missing");

      return res.status(400).json({
        success: false,
        message:
          "Audio file was not received by the server. Please record again.",
      });
    }

    console.log("Audio successfully received:");
    console.log("Field:", req.file.fieldname);
    console.log("Original name:", req.file.originalname);
    console.log("MIME:", req.file.mimetype);
    console.log("Size:", req.file.size);
    console.log("Path:", req.file.path);

    // ==========================================
    // VALIDATE CATEGORY
    // ==========================================

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
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

    console.log("Question record created:", questionRecord._id);

    try {
      // ==========================================
      // TRANSCRIBE AUDIO
      // ==========================================

      console.log("Starting audio transcription...");

      const transcription = await transcribeAudio(req.file);

      console.log("Transcription:", transcription);

      if (!transcription || !transcription.trim()) {
        throw new Error("Unable to understand the audio recording.");
      }

      questionRecord.transcription = transcription.trim();
      questionRecord.question = transcription.trim();

      await questionRecord.save();

      // ==========================================
      // GENERATE AI ANSWER
      // ==========================================

      console.log("Generating AI answer...");

      const answer = await generateAnswer({
        question: transcription.trim(),
        category,
      });

      console.log("AI answer generated.");

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
      console.error("VOICE PROCESSING ERROR:");
      console.error(processingError);

      questionRecord.status = "failed";

      questionRecord.errorMessage =
        processingError.message || "Voice processing failed.";

      await questionRecord.save();

      throw processingError;
    }
  } catch (error) {
    console.error("VOICE QUESTION ERROR:");
    console.error(error);

    next(error);
  }
};

// =========================
// GET QUESTION
// =========================
export const getQuestionById = async (req, res, next) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate("category", "name slug icon description");

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found.",
      });
    }

    res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    next(error);
  }
};
