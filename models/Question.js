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
      index: true,
    },

    // =========================
    // Category
    // =========================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
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
      maxlength: 5000,
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
      maxlength: 5000,
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
      index: true,
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

// ==========================================
// INDEXES
// ==========================================

// Useful for user's question history
questionSchema.index({
  user: 1,
  createdAt: -1,
});

// Useful for ownership + ID lookup patterns
questionSchema.index({
  user: 1,
  _id: 1,
});

const Question = mongoose.model("Question", questionSchema);

export default Question;
