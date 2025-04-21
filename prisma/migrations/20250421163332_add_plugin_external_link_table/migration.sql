-- CreateTable
CREATE TABLE "ExternalLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pluginId" TEXT NOT NULL,
    "externalSystemUrl" TEXT,
    "externalIdentifiers" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ExternalLink_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "ExampleMap" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExternalLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExternalLink_mapId_idx" ON "ExternalLink"("mapId");

-- CreateIndex
CREATE INDEX "ExternalLink_userId_idx" ON "ExternalLink"("userId");
