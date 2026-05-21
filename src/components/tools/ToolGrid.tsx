type ToolGridProps = {
  tools: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    url: string;
    iconUrl: string | null;
  }>;
};

export function ToolGrid({ tools }: ToolGridProps) {
  if (tools.length === 0) {
    return <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No active tools in this category.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => (
        <article key={tool.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-blue-50 bg-cover bg-center text-sm font-semibold text-blue-700" style={tool.iconUrl ? { backgroundImage: `url(${tool.iconUrl})` } : undefined}>
              {tool.iconUrl ? null : tool.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-950">{tool.name}</h2>
              <p className="mt-1 text-xs font-medium text-slate-500">{tool.category}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{tool.description}</p>
          <a href={tool.url} target="_blank" rel="noreferrer" className="focus-ring mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            Use now
          </a>
        </article>
      ))}
    </div>
  );
}
