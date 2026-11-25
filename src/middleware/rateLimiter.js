const rateLimit = require("express-rate-limit");

const bulkActionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many bulk action requests. Please try again later.",
  },
});

module.exports = bulkActionLimiter;
