-- CreateTable
CREATE TABLE "PluginConfiguration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pluginId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PluginConfiguration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PluginConfiguration_userId_idx" ON "PluginConfiguration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PluginConfiguration_userId_pluginId_key" ON "PluginConfiguration"("userId", "pluginId");
