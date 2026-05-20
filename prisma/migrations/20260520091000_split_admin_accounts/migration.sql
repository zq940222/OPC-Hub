-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUB_ADMIN');

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- Move legacy frontend admin users into the separated backend admin table.
INSERT INTO "Admin" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
SELECT "id", "email", "password", COALESCE("name", "email"), 'ADMIN', "createdAt", "updatedAt"
FROM "User"
WHERE "role" = 'ADMIN' AND "email" IS NOT NULL AND "password" IS NOT NULL
ON CONFLICT ("email") DO NOTHING;

UPDATE "User" SET "role" = 'OPC' WHERE "role" = 'ADMIN';

-- Repoint AdminSubAccount from frontend users to backend admins.
ALTER TABLE "AdminSubAccount" DROP CONSTRAINT IF EXISTS "AdminSubAccount_userId_fkey";
ALTER TABLE "AdminSubAccount" DROP CONSTRAINT IF EXISTS "AdminSubAccount_createdById_fkey";
DELETE FROM "AdminSubAccount";
DROP INDEX IF EXISTS "AdminSubAccount_userId_key";
ALTER TABLE "AdminSubAccount" DROP COLUMN IF EXISTS "userId";
ALTER TABLE "AdminSubAccount" ADD COLUMN "adminId" TEXT;
ALTER TABLE "AdminSubAccount" ALTER COLUMN "adminId" SET NOT NULL;
CREATE UNIQUE INDEX "AdminSubAccount_adminId_key" ON "AdminSubAccount"("adminId");
ALTER TABLE "AdminSubAccount" ADD CONSTRAINT "AdminSubAccount_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminSubAccount" ADD CONSTRAINT "AdminSubAccount_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
