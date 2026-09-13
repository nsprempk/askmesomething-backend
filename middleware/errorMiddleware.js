import multer from "multer";

// ==========================================
// 404 - ROUTE NOT FOUND
// ==========================================

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);

  error.statusCode = 404;

  next(error);
};

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

export const errorHandler = (error, req, res, next) => {
  console.error("=================================");
  console.error("GLOBAL ERROR");
  console.error("=================================");
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Name:", error.name);
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("=================================");

  // ==========================================
  // DEFAULT STATUS
  // ==========================================

  let statusCode =
    error.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // ==========================================
  // MULTER ERROR
  // ==========================================

  if (error instanceof multer.MulterError) {
    statusCode = 400;

    let message = "File upload failed.";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "Uploaded file is too large.";
        break;

      case "LIMIT_FILE_COUNT":
        message = "Too many files were uploaded.";
        break;

      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected upload field.";
        break;

      case "LIMIT_FIELD_COUNT":
        message = "Too many form fields.";
        break;

      case "LIMIT_FIELD_KEY":
        message = "Form field name is too long.";
        break;

      case "LIMIT_FIELD_VALUE":
        message = "Form field value is too large.";
        break;

      case "LIMIT_PART_COUNT":
        message = "Too many multipart form parts.";
        break;

      default:
        message = "Invalid file upload.";
    }

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // ==========================================
  // FILE TYPE / FILE FILTER ERROR
  // ==========================================

  if (
    error.message?.includes("Unsupported image format") ||
    error.message?.includes("Unsupported audio format") ||
    error.message?.includes("Invalid image format") ||
    error.message?.includes("Invalid audio format") ||
    error.message?.includes("Invalid image field") ||
    error.message?.includes("Invalid audio field")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // ==========================================
  // MONGOOSE VALIDATION ERROR
  // ==========================================

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);

    return res.status(400).json({
      success: false,
      message: messages[0] || "Invalid data.",
    });
  }

  // ==========================================
  // MONGOOSE CAST ERROR
  // ==========================================

  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid request data.",
    });
  }

  // ==========================================
  // DUPLICATE MONGODB KEY
  // ==========================================

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "The requested resource already exists.",
    });
  }

  // ==========================================
  // JSON BODY PARSING ERROR
  // ==========================================

  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      success: false,
      message: "Invalid request data.",
    });
  }

  // ==========================================
  // CLIENT ERROR
  // ==========================================

  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message: error.message || "The request could not be completed.",
    });
  }

  // ==========================================
  // PRODUCTION SERVER ERROR
  // ==========================================

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server. Please try again later.",
  });
};
