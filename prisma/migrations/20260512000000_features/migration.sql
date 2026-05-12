-- Add tags field to Event
ALTER TABLE "Event" ADD COLUMN "tags" TEXT;

-- ScrapedUrl — tracks crawled URLs for deduplication
CREATE TABLE "ScrapedUrl" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lastScrape" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScrapedUrl_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScrapedUrl_url_key" ON "ScrapedUrl"("url");

-- UserEvent — personal saved/hearted events
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserEvent_userId_eventId_key" ON "UserEvent"("userId", "eventId");
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserInterest — user areas of interest
CREATE TABLE "UserInterest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interest" TEXT NOT NULL,
    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserInterest_userId_interest_key" ON "UserInterest"("userId", "interest");
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NotificationPreference — per-user notification channel config
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "target" TEXT NOT NULL DEFAULT '',
    "remindBefore" INTEGER NOT NULL DEFAULT 24,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PlatformSettings — singleton row for branding/theming
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "platformName" TEXT NOT NULL DEFAULT 'DS EventHub',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT 'indigo',
    "privacyPolicyUrl" TEXT,
    "termsUrl" TEXT,
    "customPrivacyText" TEXT,
    "customTermsText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Seed the singleton settings row
INSERT INTO "PlatformSettings" ("id", "platformName", "primaryColor", "updatedAt")
VALUES ('singleton', 'DS EventHub', 'indigo', NOW())
ON CONFLICT ("id") DO NOTHING;
