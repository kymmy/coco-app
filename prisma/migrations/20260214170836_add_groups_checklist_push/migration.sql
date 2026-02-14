-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "claimedBy" TEXT,
    CONSTRAINT "ChecklistItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "groupIds" TEXT NOT NULL DEFAULT '[]'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "endDate" DATETIME,
    "location" TEXT NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "eventLink" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL DEFAULT 'autre',
    "price" TEXT NOT NULL DEFAULT 'Gratuit',
    "maxParticipants" INTEGER,
    "organizer" TEXT NOT NULL,
    "ageMin" INTEGER,
    "ageMax" INTEGER,
    "seriesId" TEXT,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attendees" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("ageMax", "ageMin", "attendees", "category", "createdAt", "date", "description", "endDate", "eventLink", "id", "image", "latitude", "location", "longitude", "maxParticipants", "organizer", "price", "seriesId", "title") SELECT "ageMax", "ageMin", "attendees", "category", "createdAt", "date", "description", "endDate", "eventLink", "id", "image", "latitude", "location", "longitude", "maxParticipants", "organizer", "price", "seriesId", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
