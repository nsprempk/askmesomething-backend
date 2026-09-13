import express from "express";

import {
  register,
  verifyEmail,
  resendVerificationOTP,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  deleteAccount,
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// REGISTRATION
// ==========================================

router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/resend-verification-otp", resendVerificationOTP);

// ==========================================
// LOGIN
// ==========================================

router.post("/login", login);

// ==========================================
// PASSWORD RESET
// ==========================================

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

// ==========================================
// CURRENT USER
// ==========================================

router.get("/me", protect, getMe);

router.delete("/delete-account", protect, deleteAccount);

export default router;
