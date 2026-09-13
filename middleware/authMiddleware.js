import jwt from "jsonwebtoken";

import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    // ==========================================
    // CHECK AUTHORIZATION HEADER
    // ==========================================

    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // Extract token
    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // ==========================================
    // VERIFY JWT
    // ==========================================

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your session has expired. Please login again.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ==========================================
    // VALIDATE TOKEN PAYLOAD
    // ==========================================

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }

    // ==========================================
    // ATTACH USER
    // ==========================================

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
