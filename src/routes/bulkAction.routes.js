const express = require("express");
const router = express.Router();

const bulkActionController = require("../controllers/bulkAction.controller");
const bulkActionLimiter = require("../middleware/rateLimiter");

// Create bulk action (with rate limiting)
router.post("/", bulkActionLimiter, bulkActionController.createBulkAction);

// Get all bulk actions
router.get("/", bulkActionController.getAllBulkActions);

// Get bulk action logs
router.get("/:actionId/logs", bulkActionController.getBulkActionLogs);

// Get bulk action statistics
router.get("/:actionId/stats", bulkActionController.getBulkActionStats);

// Get bulk action details
router.get("/:actionId", bulkActionController.getBulkActionById);

module.exports = router;
