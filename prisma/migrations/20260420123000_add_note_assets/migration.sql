-- CreateTable
CREATE TABLE "NoteAsset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "noteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'UPLOAD',
    "storageKey" TEXT,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT,
    "fileExt" TEXT,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "checksum" TEXT,
    "ocrText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NoteAsset_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NoteAsset_noteId_sortOrder_idx" ON "NoteAsset"("noteId", "sortOrder");

-- CreateIndex
CREATE INDEX "NoteAsset_userId_createdAt_idx" ON "NoteAsset"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "NoteAsset_noteId_kind_idx" ON "NoteAsset"("noteId", "kind");

-- CreateIndex
CREATE INDEX "NoteAsset_status_idx" ON "NoteAsset"("status");
