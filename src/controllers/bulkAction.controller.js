const bulkActionService = require("../services/bulkAction.service");

// Get ID from either :id or :actionId route parameter
const getActionId = (req) => req.params.id || req.params.actionId;

// Create bulk action
const createBulkAction = async (req, res) => {
  try {
    const { entity, action, ids, data } = req.body || {};

    // Validate IDs
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id) => Number.isInteger(id) && id > 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of valid positive integer IDs",
      });
    }

    // Validate update data
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      Object.keys(data).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid non-empty update data",
      });
    }

    const result = await bulkActionService.createBulkAction({
      ids,
      data,
      entity,
      action,
    });

    return res.status(202).json({
      success: true,
      message: "Bulk action queued successfully",
      data: result,
    });
  } catch (error) {
    console.error("Bulk Action Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create bulk action",
    });
  }
};

// Get all bulk actions
const getAllBulkActions = async (req, res) => {
  try {
    const result = await bulkActionService.getAllBulkActions(req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Bulk Actions Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get bulk action by ID
const getBulkActionById = async (req, res) => {
  try {
    const id = getActionId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Bulk action ID is required",
      });
    }

    const result = await bulkActionService.getBulkActionById(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Bulk action not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Bulk Action Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get bulk action statistics
const getBulkActionStats = async (req, res) => {
  try {
    const id = getActionId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Bulk action ID is required",
      });
    }

    const result = await bulkActionService.getBulkActionStats(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Bulk action not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Bulk Action Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get bulk action logs
const getBulkActionLogs = async (req, res) => {
  try {
    const id = getActionId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Bulk action ID is required",
      });
    }

    const result = await bulkActionService.getBulkActionLogs(id, req.query);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Bulk action not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get Bulk Action Logs Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createBulkAction,
  getAllBulkActions,
  getBulkActionById,
  getBulkActionStats,
  getBulkActionLogs,
};
