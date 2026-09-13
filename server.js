import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// ==========================================
// LOAD ENVIRONMENT VARIABLES
// ==========================================

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// CONNECT DATABASE
// ==========================================

connectDB();

// ==========================================
// SECURITY
// ==========================================

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

// ==========================================
// CORS
// ==========================================

// Allowed frontend origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://askmesomething.site",
  "https://www.askmesomething.site",
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header.
      // Useful for Postman, server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS blocked origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
    ],
  }),
);

// ==========================================
// BODY PARSER
// ==========================================

app.use(
  express.json({
    limit: "10mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

// ==========================================
// STATIC UPLOADS
// ==========================================

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ==========================================
// RATE LIMITER
// ==========================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);

// ==========================================
// API ROUTES
// ==========================================

// Authentication
app.use("/api/auth", authRoutes);

// Categories
app.use("/api/categories", categoryRoutes);

// Questions
app.use("/api/questions", questionRoutes);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ask Me Something API is running",
    website: "Ask Me Something",
  });
});

// ==========================================
// API HEALTH CHECK
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

// ==========================================
// 404 HANDLER
// ==========================================

app.use(notFound);

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log("=================================");
  console.log("Ask Me Something API");
  console.log("=================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log("=================================");
});
