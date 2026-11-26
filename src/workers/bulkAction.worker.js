require("dotenv").config();

const prisma = require("../config/prisma");

const BATCH_SIZE = 100;
const POLL_INTERVAL = 2000;

const ALLOWED_CONTACT_FIELDS = ["name", "email", "age", "status"];

// Validate the job payload before processing
const validateJobPayload = (job) => {
  const payload = job.payload;

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid job payload");
  }

  const { ids, data } = payload;

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    !ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    throw new Error("Invalid contact IDs");
  }

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    Object.keys(data).length === 0
  ) {
    throw new Error("Invalid update data");
  }

  const invalidFields = Object.keys(data).filter(
    (field) => !ALLOWED_CONTACT_FIELDS.includes(field),
  );

  if (invalidFields.length > 0) {
    throw new Error(`Invalid Contact fields: ${invalidFields.join(", ")}`);
  }

  if (job.entity !== "contacts" || job.action !== "update") {
    throw new Error("Unsupported entity or action");
  }

  // Normalize email before updating contacts
  const updateData = { ...data };

  if (updateData.email !== undefined) {
    if (typeof updateData.email !== "string" || !updateData.email.trim()) {
      throw new Error("Invalid email address");
    }

    updateData.email = updateData.email.trim().toLowerCase();
  }

  return { ids, data: updateData };
};

// Log skipped records
const logSkippedRecord = async (jobId, id, message) => {
  await prisma.bulkActionLog.create({
    data: {
      bulkActionId: jobId,
      recordId: Number(id),
      status: "skipped",
      message,
    },
  });
};

// Process one contact and save its result
const processContact = async (job, id, data) => {
  try {
    await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.update({
        where: { id: Number(id) },
        data,
      });

      await tx.bulkActionLog.create({
        data: {
          bulkActionId: job.id,
          recordId: Number(id),
          status: "success",
          message: "Contact updated successfully",
          data: contact,
        },
      });

      await tx.bulkAction.update({
        where: { id: job.id },
        data: {
          successful: { increment: 1 },
        },
      });
    });
  } catch (error) {
    let message = "Failed to update contact";

    if (error.code === "P2025") {
      message = "Contact not found";
    } else if (error.code === "P2002") {
      message = "Email already exists";
    }

    console.error(`Contact ${id} failed:`, error.message);

    await prisma.$transaction(async (tx) => {
      await tx.bulkActionLog.create({
        data: {
          bulkActionId: job.id,
          recordId: Number(id),
          status: "failed",
          message,
        },
      });

      await tx.bulkAction.update({
        where: { id: job.id },
        data: {
          failed: { increment: 1 },
        },
      });
    });
  }
};

// Process all records in a bulk action
const processBulkAction = async (job) => {
  try {
    const { ids, data } = validateJobPayload(job);

    const seenIds = new Set();
    const seenEmails = new Set();

    const normalizedEmail =
      data.email !== undefined ? data.email.toLowerCase() : null;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);

      for (const id of batch) {
        const numericId = Number(id);

        // Skip duplicate contact IDs
        if (seenIds.has(numericId)) {
          await logSkippedRecord(
            job.id,
            numericId,
            "Duplicate contact ID in bulk request",
          );

          continue;
        }

        seenIds.add(numericId);

        // A shared email update can only be assigned to one contact
        if (normalizedEmail !== null) {
          if (seenEmails.has(normalizedEmail)) {
            await logSkippedRecord(
              job.id,
              numericId,
              "Duplicate email in bulk request",
            );

            continue;
          }

          seenEmails.add(normalizedEmail);
        }

        await processContact(job, numericId, data);
      }
    }

    await prisma.bulkAction.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    console.log(`Bulk action completed: ${job.id}`);
  } catch (error) {
    console.error(`Worker error for ${job.id}:`, error);

    await prisma.bulkAction.update({
      where: { id: job.id },
      data: {
        status: "failed",
        completedAt: new Date(),
      },
    });
  }
};

// Atomically claim the next queued job.
// SKIP LOCKED allows multiple workers to claim different jobs.
const claimNextJob = async () => {
  const jobs = await prisma.$queryRaw`
    UPDATE "BulkAction"
    SET "status" = 'processing'
    WHERE "id" = (
      SELECT "id"
      FROM "BulkAction"
      WHERE "status" = 'queued'
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `;

  return jobs[0] || null;
};

// Graceful shutdown
let isShuttingDown = false;

const startWorker = async () => {
  console.log("Bulk action worker started...");

  while (!isShuttingDown) {
    try {
      const job = await claimNextJob();

      if (job) {
        await processBulkAction(job);
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      console.error("Worker polling error:", error);

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  await prisma.$disconnect();

  console.log("Bulk action worker stopped.");
};

process.on("SIGINT", () => {
  console.log("Shutdown signal received...");
  isShuttingDown = true;
});

process.on("SIGTERM", () => {
  console.log("Termination signal received...");
  isShuttingDown = true;
});

startWorker();
