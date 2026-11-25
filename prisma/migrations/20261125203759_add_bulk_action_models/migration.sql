-- CreateTable
CREATE TABLE "BulkAction" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "successful" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BulkAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BulkActionLog" (
    "id" SERIAL NOT NULL,
    "bulkActionId" TEXT NOT NULL,
    "recordId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkActionLog_bulkActionId_status_idx" ON "BulkActionLog"("bulkActionId", "status");

-- AddForeignKey
ALTER TABLE "BulkActionLog" ADD CONSTRAINT "BulkActionLog_bulkActionId_fkey" FOREIGN KEY ("bulkActionId") REFERENCES "BulkAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
