const { randomUUID } = require("crypto");
const prisma = require("../config/prisma");

// Create a bulk action job
const createBulkAction = async ({
  ids,
  data,
  entity = "contacts",
  action = "update",
}) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("A non-empty ids array is required");
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Valid update data is required");
  }

  const job = await prisma.bulkAction.create({
    data: {
      id: randomUUID(),
      entity,
      action,
      status: "queued",
      total: ids.length,
      payload: { ids, data },
    },
  });

  return job;
};

// Get bulk action by ID
const getBulkActionById = async (id) => {
  return await prisma.bulkAction.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
};

// Get bulk action statistics
const getBulkActionStats = async (id) => {
  const job = await prisma.bulkAction.findUnique({
    where: { id },
  });

  if (!job) return null;

  const skipped = await prisma.bulkActionLog.count({
    where: {
      bulkActionId: id,
      status: "skipped",
    },
  });

  const processed = job.successful + job.failed + skipped;

  return {
    total: job.total,
    successful: job.successful,
    failed: job.failed,
    skipped,
    processed,
    remaining: job.total - processed,
    progress:
      job.total === 0
        ? 100
        : Number(((processed / job.total) * 100).toFixed(2)),
    status: job.status,
  };
};

// Get all bulk actions with pagination
const getAllBulkActions = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.bulkAction.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.bulkAction.count(),
  ]);

  return {
    jobs,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

// Get bulk action logs
const getBulkActionLogs = async (id, query = {}) => {
  const job = await prisma.bulkAction.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!job) return null;

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 100));

  const skip = (page - 1) * limit;

  const where = {
    bulkActionId: id,
  };

  if (["success", "failed", "skipped"].includes(query.status)) {
    where.status = query.status;
  }

  const [logs, total] = await Promise.all([
    prisma.bulkActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.bulkActionLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

module.exports = {
  createBulkAction,
  getBulkActionById,
  getBulkActionStats,
  getAllBulkActions,
  getBulkActionLogs,
};
