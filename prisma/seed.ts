import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "229230041@qq.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
const adminName = process.env.SEED_ADMIN_NAME ?? "System Admin";

async function main() {
  const password = await bcrypt.hash(adminPassword, 12);

  const admin = await db.admin.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password,
      role: "ADMIN",
    },
    create: {
      email: adminEmail,
      name: adminName,
      password,
      role: "ADMIN",
    },
  });

  console.log(`Seeded admin account: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
