import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";
import Question from "../models/Question.js";

// ==========================================
// GENERATE JWT
// ==========================================

const generateToken = (userId) => {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// ==========================================
// EMAIL TRANSPORTER
// ==========================================

const emailPort = Number(process.env.EMAIL_PORT || 465);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ==========================================
// GENERATE OTP
// ==========================================

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ==========================================
// HASH OTP
// ==========================================

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// ==========================================
// SEND REGISTRATION OTP EMAIL
// ==========================================

const sendRegistrationOTPEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"Ask Me Something" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Ask Me Something Email",

    text: `
Hello ${name},

Thank you for creating an Ask Me Something account.

Your email verification code is:

${otp}

This code will expire in 10 minutes.

If you did not try to create an account, you can safely ignore this email.

Ask Me Something
    `,

    html: `
      <div style="
        margin:0;
        padding:40px 20px;
        background:#f8fafc;
        font-family:Arial,sans-serif;
      ">

        <div style="
          max-width:560px;
          margin:0 auto;
          background:#ffffff;
          border-radius:20px;
          padding:35px;
          border:1px solid #e2e8f0;
        ">

          <div style="text-align:center;">

            <div style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              width:56px;
              height:56px;
              border-radius:16px;
              background:#eff6ff;
              color:#2563eb;
              font-size:26px;
            ">
              ✨
            </div>

            <h1 style="
              margin:20px 0 10px;
              color:#0f172a;
              font-size:26px;
            ">
              Verify Your Email
            </h1>

            <p style="
              margin:0;
              color:#64748b;
              font-size:15px;
              line-height:1.6;
            ">
              Hello ${name}, please verify your email address to complete your
              Ask Me Something registration.
            </p>

          </div>

          <div style="
            margin:30px 0;
            text-align:center;
          ">

            <p style="
              margin:0 0 12px;
              color:#64748b;
              font-size:14px;
            ">
              Your verification code
            </p>

            <div style="
              display:inline-block;
              padding:16px 28px;
              background:#eff6ff;
              border:1px solid #bfdbfe;
              border-radius:14px;
              color:#1d4ed8;
              font-size:32px;
              font-weight:bold;
              letter-spacing:8px;
            ">
              ${otp}
            </div>

          </div>

          <p style="
            color:#64748b;
            font-size:14px;
            line-height:1.6;
          ">
            This verification code will expire in
            <strong>10 minutes</strong>.
          </p>

          <p style="
            color:#64748b;
            font-size:14px;
            line-height:1.6;
          ">
            If you did not try to create an account, you can safely ignore
            this email.
          </p>

          <hr style="
            border:none;
            border-top:1px solid #e2e8f0;
            margin:25px 0;
          " />

          <p style="
            margin:0;
            text-align:center;
            color:#94a3b8;
            font-size:12px;
          ">
            Ask Me Something
          </p>

        </div>
      </div>
    `,
  });
};

// ==========================================
// REGISTER
// ==========================================

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // ==========================================
    // VALIDATE INPUT
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const cleanName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (cleanName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 50 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // ==========================================
    // CHECK EXISTING USER
    // ==========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // ==========================================
    // CHECK EXISTING PENDING REGISTRATION
    // ==========================================

    let pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    // ==========================================
    // RESEND PROTECTION
    // ==========================================

    if (pendingRegistration) {
      const secondsSinceLastOTP =
        (Date.now() - pendingRegistration.lastOtpSentAt.getTime()) / 1000;

      if (secondsSinceLastOTP < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(
            60 - secondsSinceLastOTP,
          )} seconds before requesting another OTP.`,
        });
      }
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 12);

    // ==========================================
    // GENERATE OTP
    // ==========================================

    const otp = generateOTP();

    const otpHash = hashOTP(otp);

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // ==========================================
    // CREATE / UPDATE PENDING REGISTRATION
    // ==========================================

    if (pendingRegistration) {
      pendingRegistration.name = cleanName;
      pendingRegistration.password = hashedPassword;
      pendingRegistration.otpHash = otpHash;
      pendingRegistration.otpExpiresAt = otpExpiresAt;
      pendingRegistration.otpAttempts = 0;
      pendingRegistration.lastOtpSentAt = new Date();

      await pendingRegistration.save();
    } else {
      pendingRegistration = await PendingRegistration.create({
        name: cleanName,
        email: normalizedEmail,
        password: hashedPassword,
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
        lastOtpSentAt: new Date(),
      });
    }

    // ==========================================
    // SEND OTP
    // ==========================================

    try {
      await sendRegistrationOTPEmail(normalizedEmail, cleanName, otp);
    } catch (emailError) {
      // Delete pending registration if email fails
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      throw emailError;
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email address.",
      email: normalizedEmail,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// VERIFY EMAIL OTP
// ==========================================

export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOTP = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOTP)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be 6 digits",
      });
    }

    // ==========================================
    // FIND PENDING REGISTRATION
    // ==========================================

    const pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    if (!pendingRegistration) {
      return res.status(400).json({
        success: false,
        message:
          "Registration request not found or the verification code has expired.",
      });
    }

    // ==========================================
    // CHECK OTP EXPIRATION
    // ==========================================

    if (pendingRegistration.otpExpiresAt.getTime() < Date.now()) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please register again.",
      });
    }

    // ==========================================
    // CHECK OTP ATTEMPTS
    // ==========================================

    if (pendingRegistration.otpAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message:
          "Too many incorrect verification attempts. Please request a new OTP.",
      });
    }

    // ==========================================
    // VERIFY OTP
    // ==========================================

    const submittedOtpHash = hashOTP(cleanOTP);

    const otpMatches = crypto.timingSafeEqual(
      Buffer.from(submittedOtpHash, "hex"),
      Buffer.from(pendingRegistration.otpHash, "hex"),
    );

    if (!otpMatches) {
      pendingRegistration.otpAttempts += 1;

      await pendingRegistration.save();

      return res.status(400).json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    // ==========================================
    // CHECK AGAIN FOR EXISTING USER
    // ==========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pendingRegistration._id,
      });

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ==========================================
    // CREATE REAL USER
    // ==========================================

    const user = await User.create({
      name: pendingRegistration.name,
      email: pendingRegistration.email,
      password: pendingRegistration.password,
      role: "user",
      plan: "free",
      isActive: true,
    });

    // ==========================================
    // DELETE PENDING REGISTRATION
    // ==========================================

    await PendingRegistration.deleteOne({
      _id: pendingRegistration._id,
    });

    // ==========================================
    // GENERATE LOGIN TOKEN
    // ==========================================

    const token = generateToken(user._id);

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,
      message: "Email verified and account created successfully.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RESEND REGISTRATION OTP
// ==========================================

export const resendVerificationOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ==========================================
    // CHECK IF USER ALREADY EXISTS
    // ==========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ==========================================
    // FIND PENDING REGISTRATION
    // ==========================================

    const pendingRegistration = await PendingRegistration.findOne({
      email: normalizedEmail,
    });

    if (!pendingRegistration) {
      return res.status(404).json({
        success: false,
        message: "Registration request not found. Please register again.",
      });
    }

    // ==========================================
    // RESEND COOLDOWN
    // ==========================================

    const secondsSinceLastOTP =
      (Date.now() - pendingRegistration.lastOtpSentAt.getTime()) / 1000;

    if (secondsSinceLastOTP < 60) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${Math.ceil(
          60 - secondsSinceLastOTP,
        )} seconds before requesting another OTP.`,
      });
    }

    // ==========================================
    // GENERATE NEW OTP
    // ==========================================

    const otp = generateOTP();

    pendingRegistration.otpHash = hashOTP(otp);

    pendingRegistration.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    pendingRegistration.otpAttempts = 0;
    pendingRegistration.lastOtpSentAt = new Date();

    await pendingRegistration.save();

    // ==========================================
    // SEND EMAIL
    // ==========================================

    await sendRegistrationOTPEmail(
      normalizedEmail,
      pendingRegistration.name,
      otp,
    );

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LOGIN
// ==========================================

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET CURRENT USER
// ==========================================

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Ask Me Something" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Ask Me Something Password",

      text: `
You requested a password reset for your Ask Me Something account.

Use the link below to create a new password:

${resetUrl}

This link will expire in 15 minutes.

If you did not request this password reset, you can safely ignore this email.

Ask Me Something
      `,

      html: `
        <div style="
          margin:0;
          padding:40px 20px;
          background:#f8fafc;
          font-family:Arial,sans-serif;
        ">

          <div style="
            max-width:560px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            padding:35px;
            border:1px solid #e2e8f0;
          ">

            <div style="text-align:center;">

              <div style="
                display:inline-flex;
                align-items:center;
                justify-content:center;
                width:56px;
                height:56px;
                border-radius:16px;
                background:#eff6ff;
                color:#2563eb;
                font-size:26px;
              ">
                ✨
              </div>

              <h1 style="
                margin:20px 0 10px;
                color:#0f172a;
                font-size:26px;
              ">
                Reset Your Password
              </h1>

              <p style="
                margin:0;
                color:#64748b;
                font-size:15px;
                line-height:1.6;
              ">
                We received a request to reset your Ask Me Something password.
              </p>

            </div>

            <div style="
              margin:30px 0;
              text-align:center;
            ">

              <a
                href="${resetUrl}"
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#2563eb;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:bold;
                  font-size:15px;
                "
              >
                Reset Password
              </a>

            </div>

            <p style="
              color:#64748b;
              font-size:14px;
              line-height:1.6;
            ">
              This password reset link will expire in
              <strong>15 minutes</strong>.
            </p>

            <p style="
              color:#64748b;
              font-size:14px;
              line-height:1.6;
            ">
              If you did not request this password reset,
              you can safely ignore this email.
            </p>

            <hr style="
              border:none;
              border-top:1px solid #e2e8f0;
              margin:25px 0;
            " />

            <p style="
              margin:0;
              text-align:center;
              color:#94a3b8;
              font-size:12px;
            ">
              Ask Me Something
            </p>

          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// RESET PASSWORD
// ==========================================

export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,

      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This password reset link is invalid or has expired.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE ACCOUNT
// ==========================================

export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Current password is required.",
      });
    }

    // Get complete user because protect middleware removes password
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    // Delete user's questions
    await Question.deleteMany({
      user: user._id,
    });

    // Delete user account
    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: "Your account has been permanently deleted.",
    });
  } catch (error) {
    next(error);
  }
};
