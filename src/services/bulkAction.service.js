const { randomUUID } = require("crypto");
const prisma = require("../config/prisma");

// Allowed Contact fields
const ALLOWED_CONTACT_FIELDS = ["name", "email", "age", "status"];

// Create a bulk action job
const createBulkAction = async ({
  ids,
  data,
  entity = "contacts",
  action = "update",
}) => {
  // Validate IDs
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    throw new Error("Please provide an array of valid positive integer IDs");
  }

  // Validate update data
  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length === 0
  ) {
    throw new Error("Valid non-empty update data is required");
  }

  // Validate entity
  if (entity !== "contacts") {
    throw new Error("Unsupported entity. Only contacts are supported");
  }

  // Validate action
  if (action !== "update") {
    throw new Error("Unsupported action. Only update is supported");
  }

  // Validate allowed Contact fields
  const invalidFields = Object.keys(data).filter(
    (field) => !ALLOWED_CONTACT_FIELDS.includes(field),
  );

  if (invalidFields.length > 0) {
    throw new Error(`Invalid Contact fields: ${invalidFields.join(", ")}`);
  }

  // Create job in database
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
const getBulkActionById = (id) => {
  return prisma.bulkAction.findUnique({
    where: { id },
  });
};

// Get bulk action statistics
const getBulkActionStats = async (id) => {
  return prisma.$transaction(async (tx) => {
    const job = await tx.bulkAction.findUnique({
      where: { id },
    });

    if (!job) {
      return null;
    }

    const skipped = await tx.bulkActionLog.count({
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
      remaining: Math.max(0, job.total - processed),
      progress:
        job.total === 0
          ? 100
          : Number(((processed / job.total) * 100).toFixed(2)),
      status: job.status,
    };
  });
};

// Get all bulk actions with pagination
const getAllBulkActions = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    prisma.bulkAction.findMany({
      orderBy: {
        createdAt: "desc",
      },
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

// Get bulk action logs with pagination and filtering
const getBulkActionLogs = async (id, query = {}) => {
  const job = await prisma.bulkAction.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!job) {
    return null;
  }

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
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.bulkActionLog.count({
      where,
    }),
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
