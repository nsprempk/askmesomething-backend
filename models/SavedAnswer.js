import mongoose from "mongoose";

const savedAnswerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const SavedAnswer = mongoose.model("SavedAnswer", savedAnswerSchema);

export default SavedAnswer;
