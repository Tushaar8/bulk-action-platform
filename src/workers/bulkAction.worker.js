require("dotenv").config();
const prisma = require("../config/prisma");

const BATCH_SIZE = 100;
const POLL_INTERVAL = 2000;

const processBulkAction = async (job) => {
  const { ids, data } = job.payload;

  try {
    // Detect duplicate emails within this bulk request
    const duplicateIds = new Set();

    if (data.email) {
      const seenEmails = new Set();

      for (const id of ids) {
        const email = data.email;

        if (seenEmails.has(email)) {
          duplicateIds.add(Number(id));
        } else {
          seenEmails.add(email);
        }
      }
    }

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);

      for (const id of batch) {
        try {
          if (duplicateIds.has(Number(id))) {
            await prisma.bulkActionLog.create({
              data: {
                bulkActionId: job.id,
                recordId: Number(id),
                status: "skipped",
                message: "Duplicate email in bulk request",
              },
            });
            continue;
          }

          const contact = await prisma.contact.update({
            where: { id: Number(id) },
            data,
          });

          await prisma.bulkActionLog.create({
            data: {
              bulkActionId: job.id,
              recordId: Number(id),
              status: "success",
              message: "Contact updated successfully",
              data: contact,
            },
          });

          await prisma.bulkAction.update({
            where: { id: job.id },
            data: { successful: { increment: 1 } },
          });
        } catch (error) {
          await prisma.bulkActionLog.create({
            data: {
              bulkActionId: job.id,
              recordId: Number(id),
              status: "failed",
              message:
                error.code === "P2025"
                  ? "Contact not found"
                  : error.code === "P2002"
                    ? "Email already exists"
                    : "Failed to update contact",
            },
          });

          await prisma.bulkAction.update({
            where: { id: job.id },
            data: { failed: { increment: 1 } },
          });
        }
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
      data: { status: "failed" },
    });
  }
};

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

const startWorker = async () => {
  console.log("Bulk action worker started...");

  while (true) {
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
};

startWorker();
