-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."workspaces" ADD COLUMN     "deletedAt" TIMESTAMP(3);
