import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFORMATION
    // ==========================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    // ==========================================
    // ROLE
    // ==========================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ==========================================
    // PROFILE
    // ==========================================

    avatar: {
      type: String,
      default: "",
    },

    // ==========================================
    // PLAN
    // ==========================================

    plan: {
      type: String,
      enum: ["free", "basic", "pro", "premium"],
      default: "free",
    },

    // ==========================================
    // QUESTION LIMITS
    // ==========================================

    dailyQuestions: {
      type: Number,
      default: 0,
    },

    monthlyQuestions: {
      type: Number,
      default: 0,
    },

    lastDailyReset: {
      type: Date,
      default: Date.now,
    },

    lastMonthlyReset: {
      type: Date,
      default: Date.now,
    },

    // ==========================================
    // ACCOUNT STATUS
    // ==========================================

    isActive: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
