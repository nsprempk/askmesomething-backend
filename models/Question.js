import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    // =========================
    // User
    // =========================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // =========================
    // Category
    // =========================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // =========================
    // Question type
    // =========================
    type: {
      type: String,
      enum: ["text", "image", "voice"],
      required: true,
      default: "text",
    },

    // =========================
    // Question
    // =========================
    question: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // Image
    // =========================
    imagePath: {
      type: String,
      default: "",
    },

    // =========================
    // Audio
    // =========================
    audioPath: {
      type: String,
      default: "",
    },

    // =========================
    // Voice transcription
    // =========================
    transcription: {
      type: String,
      default: "",
    },

    // =========================
    // AI answer
    // =========================
    answer: {
      type: String,
      default: "",
    },

    // =========================
    // Status
    // =========================
    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    // =========================
    // Error
    // =========================
    errorMessage: {
      type: String,
      default: "",
    },

    // =========================
    // Saved
    // =========================
    isSaved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Question = mongoose.model("Question", questionSchema);

export default Question;
