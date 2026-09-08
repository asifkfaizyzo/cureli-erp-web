-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('PERSONAL_DETAILS', 'LOCATION', 'VEHICLE_DETAILS', 'RC_UPLOAD', 'DL_UPLOAD', 'AADHAAR_UPLOAD', 'PAN_UPLOAD', 'LIVE_PHOTO', 'COMPLETED');

-- AlterTable
ALTER TABLE "rider_documents" ADD COLUMN     "was_rejected_this_cycle" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "riders" ADD COLUMN     "first_submitted_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_resubmission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_resubmitted_at" TIMESTAMPTZ(6),
ADD COLUMN     "onboarding_step" "OnboardingStep" NOT NULL DEFAULT 'PERSONAL_DETAILS',
ADD COLUMN     "submitted_for_review" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "riders_onboarding_step_idx" ON "riders"("onboarding_step");

-- CreateIndex
CREATE INDEX "riders_submitted_for_review_idx" ON "riders"("submitted_for_review");
