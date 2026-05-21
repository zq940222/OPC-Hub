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

const boards = [
  ["骞冲彴鍏憡", "announcements"],
  ["AI 宸ュ叿鎺㈣", "ai-tools"],
  ["鎺ュ崟缁忛獙", "order-tips"],
  ["绋庡姟娉曞姟", "tax-legal"],
  ["缁忛獙鍒嗕韩", "experience"],
  ["闂瓟浜掑姪", "qa"],
  ["闂茶亰鐏屾按", "casual"],
] as const;

const tools = [
  {
    name: "ChatGPT",
    description: "AI 鍐欎綔銆佺瓥鍒掑拰浠ｇ爜杈呭姪宸ュ叿",
    category: "AI宸ュ叿",
    url: "https://chatgpt.com",
    order: 10,
  },
  {
    name: "Claude",
    description: "闀挎枃妗ｅ垎鏋愩€佺爺绌跺拰鍒涗綔杈呭姪",
    category: "AI宸ュ叿",
    url: "https://claude.ai",
    order: 20,
  },
  {
    name: "Feishu",
    description: "鍥㈤槦鍗忎綔銆佹枃妗ｃ€佷細璁拰椤圭洰绠＄悊",
    category: "鍗忎綔鍔炲叕",
    url: "https://www.feishu.cn",
    order: 10,
  },
  {
    name: "Notion",
    description: "鐭ヨ瘑搴撱€佷换鍔″拰杞婚噺 CRM 宸ヤ綔鍙?",
    category: "鍗忎綔鍔炲叕",
    url: "https://www.notion.so",
    order: 20,
  },
  {
    name: "QuickBooks",
    description: "灏忓井浼佷笟璁拌处銆佸彂绁ㄥ拰璐㈠姟鎶ヨ〃",
    category: "璐㈢◣璁拌处",
    url: "https://quickbooks.intuit.com",
    order: 10,
  },
  {
    name: "PandaDoc",
    description: "鍚堝悓璧疯崏銆佸鎵瑰拰鐢靛瓙绛剧讲",
    category: "鍚堝悓娉曞姟",
    url: "https://www.pandadoc.com",
    order: 10,
  },
  {
    name: "Canva",
    description: "甯傚満鐗╂枡銆佺ぞ濯掑浘鍜屽搧鐗岃瑙夎璁?",
    category: "璁捐鍒涙剰",
    url: "https://www.canva.com",
    order: 10,
  },
] as const;

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

  for (const [index, [name, slug]] of boards.entries()) {
    await db.board.upsert({
      where: { slug },
      update: { name, order: index + 1 },
      create: { name, slug, order: index + 1 },
    });
  }

  for (const tool of tools) {
    const existingTool = await db.tool.findFirst({
      where: { name: tool.name },
      select: { id: true },
    });

    if (existingTool) {
      await db.tool.update({
        where: { id: existingTool.id },
        data: tool,
      });
    } else {
      await db.tool.create({
        data: tool,
      });
    }
  }

  console.log(`Seeded ${boards.length} boards and ${tools.length} tools.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
