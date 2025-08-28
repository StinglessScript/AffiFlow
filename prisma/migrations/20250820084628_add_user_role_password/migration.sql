-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "password" TEXT,
ADD COLUMN     "role" "public"."UserRole" NOT NULL DEFAULT 'USER';
