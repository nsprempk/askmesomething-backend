import mongoose from "mongoose";

const pendingRegistrationSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER INFORMATION
    // ==========================================

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Password is already bcrypt hashed
    password: {
      type: String,
      required: true,
    },

    // ==========================================
    // OTP
    // ==========================================

    otpHash: {
      type: String,
      required: true,
    },

    otpExpiresAt: {
      type: Date,
      required: true,
    },

    // ==========================================
    // SECURITY
    // ==========================================

    otpAttempts: {
      type: Number,
      default: 0,
    },

    lastOtpSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically remove old pending registrations
pendingRegistrationSchema.index(
  { otpExpiresAt: 1 },
  {
    expireAfterSeconds: 0,
  },
);

const PendingRegistration = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema,
);

export default PendingRegistration;
