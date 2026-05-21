import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const messages = await db.message.findMany({
    where: {
      OR: [{ fromId: session.user.id }, { toId: session.user.id }],
    },
    include: {
      from: { select: { id: true, name: true, email: true } },
      to: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const conversations = new Map<string, { user: { id: string; name: string | null; email: string | null }; lastMessageAt: Date; unread: boolean; preview: string }>();
  for (const message of messages) {
    const other = message.fromId === session.user.id ? message.to : message.from;
    if (!conversations.has(other.id)) {
      conversations.set(other.id, {
        user: other,
        lastMessageAt: message.createdAt,
        unread: message.toId === session.user.id && !message.readAt,
        preview: message.content,
      });
    } else if (message.toId === session.user.id && !message.readAt) {
      conversations.get(other.id)!.unread = true;
    }
  }

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">Messages</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Private conversations</h1>
      </section>
      <section className="grid gap-3">
        {Array.from(conversations.values()).map((conversation) => (
          <Link key={conversation.user.id} href={`/community/messages/${conversation.user.id}`} className="rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-200">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-950">
                {conversation.user.name ?? conversation.user.email ?? "OPC"}
                {conversation.unread ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-600" /> : null}
              </p>
              <span className="text-xs text-slate-500">{conversation.lastMessageAt.toLocaleString("zh-CN")}</span>
            </div>
            <p className="mt-2 line-clamp-1 text-sm text-slate-500">{conversation.preview}</p>
          </Link>
        ))}
        {conversations.size === 0 ? <p className="rounded-lg border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No messages yet.</p> : null}
      </section>
    </main>
  );
}
