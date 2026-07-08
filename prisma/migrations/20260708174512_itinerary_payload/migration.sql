-- DropForeignKey
ALTER TABLE "itinerary_days" DROP CONSTRAINT "itinerary_days_itinerary_id_fkey";

-- AlterTable
ALTER TABLE "itineraries" DROP COLUMN "profile_json",
ADD COLUMN     "payload" JSONB NOT NULL;

-- DropTable
DROP TABLE "itinerary_days";

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_trip_id_key" ON "itineraries"("trip_id");

