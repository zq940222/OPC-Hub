"use client";

import { useMemo, useState } from "react";
import { ToolGrid } from "@/components/tools/ToolGrid";

type ToolCategoryTabsProps = {
  categories: string[];
  tools: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    url: string;
    iconUrl: string | null;
  }>;
};

export function ToolCategoryTabs({ categories, tools }: ToolCategoryTabsProps) {
  const [category, setCategory] = useState(categories[0] ?? "全部");
  const filteredTools = useMemo(() => (category === "全部" ? tools : tools.filter((tool) => tool.category === category)), [category, tools]);

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`focus-ring rounded-md px-4 py-2 text-sm font-semibold ${
              category === item ? "bg-blue-700 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <ToolGrid tools={filteredTools} />
    </section>
  );
}
