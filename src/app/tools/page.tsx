import { TOOL_CATEGORIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { ToolCategoryTabs } from "@/components/tools/ToolCategoryTabs";

const ALL_CATEGORY = "全部";

export default async function ToolsPage() {
  const categoryOrder = new Map<string, number>(TOOL_CATEGORIES.map((category, index) => [category, index]));
  const tools = await db.tool.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      url: true,
      iconUrl: true,
      order: true,
    },
  });

  const sortedTools = tools
    .map((tool) => ({ ...tool, categoryIndex: categoryOrder.get(tool.category) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.categoryIndex - b.categoryIndex || a.order - b.order || a.name.localeCompare(b.name))
    .map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      category: tool.category,
      url: tool.url,
      iconUrl: tool.iconUrl,
    }));

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">工具箱</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">AI 优先的经营工具</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">启用中的工具由管理员维护，并按分类组织，方便日常重复使用。</p>
      </section>
      <ToolCategoryTabs categories={[...TOOL_CATEGORIES, ALL_CATEGORY]} tools={sortedTools} />
    </main>
  );
}
