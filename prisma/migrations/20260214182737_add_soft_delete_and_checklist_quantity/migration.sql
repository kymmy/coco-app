-- AlterTable
ALTER TABLE "Event" ADD COLUMN "deletedAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "claimedBy" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ChecklistItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ChecklistItem" ("claimedBy", "eventId", "id", "label") SELECT "claimedBy", "eventId", "id", "label" FROM "ChecklistItem";
DROP TABLE "ChecklistItem";
ALTER TABLE "new_ChecklistItem" RENAME TO "ChecklistItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
