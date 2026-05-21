import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("缺少 DATABASE_URL，无法初始化种子数据。");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "229230041@qq.com";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
const adminName = process.env.SEED_ADMIN_NAME ?? "系统管理员";

const boards = [
  ["平台公告", "announcements"],
  ["AI 工具探讨", "ai-tools"],
  ["接单经验", "order-tips"],
  ["税务法务", "tax-legal"],
  ["经验分享", "experience"],
  ["问答互助", "qa"],
  ["闲聊灌水", "casual"],
] as const;

const tools = [
  {
    name: "ChatGPT",
    description: "AI 写作、策划和代码辅助工具",
    category: "AI 工具",
    url: "https://chatgpt.com",
    order: 10,
  },
  {
    name: "Claude",
    description: "长文档分析、研究和创作辅助",
    category: "AI 工具",
    url: "https://claude.ai",
    order: 20,
  },
  {
    name: "Feishu",
    description: "团队协作、文档、会议和项目管理",
    category: "协作办公",
    url: "https://www.feishu.cn",
    order: 10,
  },
  {
    name: "Notion",
    description: "知识库、任务和轻量 CRM 工作台",
    category: "协作办公",
    url: "https://www.notion.so",
    order: 20,
  },
  {
    name: "QuickBooks",
    description: "小微企业记账、发票和财务报表",
    category: "财税记账",
    url: "https://quickbooks.intuit.com",
    order: 10,
  },
  {
    name: "PandaDoc",
    description: "合同起草、审批和电子签署",
    category: "合同法务",
    url: "https://www.pandadoc.com",
    order: 10,
  },
  {
    name: "Canva",
    description: "市场物料、社媒图和品牌视觉设计",
    category: "设计创意",
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

  console.log(`已初始化管理员账号：${admin.email}`);

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

  console.log(`已初始化 ${boards.length} 个板块和 ${tools.length} 个工具。`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
