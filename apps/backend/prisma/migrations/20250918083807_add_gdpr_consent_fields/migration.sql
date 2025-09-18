-- AlterTable
ALTER TABLE "User" ADD COLUMN     "newsletterConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsletterConsentTimestamp" TIMESTAMP(3),
ADD COLUMN     "privacyConsentTimestamp" TIMESTAMP(3),
ADD COLUMN     "privacyPolicyConsent" BOOLEAN NOT NULL DEFAULT false;
