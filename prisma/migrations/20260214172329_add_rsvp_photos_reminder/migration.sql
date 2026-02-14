-- CreateTable
CREATE TABLE "Rsvp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'coming',
    CONSTRAINT "Rsvp_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventPhoto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("ageMax", "ageMin", "attendees", "category", "createdAt", "date", "description", "endDate", "eventLink", "groupId", "id", "image", "latitude", "location", "longitude", "maxParticipants", "organizer", "price", "seriesId", "title") SELECT "ageMax", "ageMin", "attendees", "category", "createdAt", "date", "description", "endDate", "eventLink", "groupId", "id", "image", "latitude", "location", "longitude", "maxParticipants", "organizer", "price", "seriesId", "title" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Rsvp_eventId_name_key" ON "Rsvp"("eventId", "name");
