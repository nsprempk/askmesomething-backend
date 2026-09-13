import multer from "multer";

// ==========================================
// 404 - ROUTE NOT FOUND
// ==========================================

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);

  res.status(404);

  next(error);
};

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

export const errorHandler = (error, req, res, next) => {
  console.error("=================================");
  console.error("GLOBAL ERROR");
  console.error("=================================");
  console.error("Name:", error.name);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("=================================");

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // ==========================================
  // MULTER ERROR
  // ==========================================

  if (error instanceof multer.MulterError) {
    statusCode = 400;

    let message = error.message;

    if (error.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file is too large.";
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      message = `Unexpected upload field: ${error.field || "unknown"}.`;
    }

    return res.status(statusCode).json({
      success: false,
      message,
      errorCode: error.code,
    });
  }

  // ==========================================
  // FILE FILTER ERROR
  // ==========================================

  if (
    error.message?.includes("Unsupported audio format") ||
    error.message?.includes("Only WEBM") ||
    error.message?.includes("Only JPG")
  ) {
    statusCode = 400;

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // ==========================================
  // NORMAL ERROR
  // ==========================================

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
};
