import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { sendMessage } from "@/actions/messages";
import { MessageThread } from "@/components/community/MessageThread";
import { db } from "@/lib/db";

export default async function MessageDetailPage(props: { params: Promise<{ userId: string }> }) {
  const { userId } = await props.params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.id === userId) redirect("/community/messages");

  const otherUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  if (!otherUser) notFound();

  await db.message.updateMany({
    where: { fromId: userId, toId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  const messages = await db.message.findMany({
    where: {
      OR: [
        { fromId: session.user.id, toId: userId },
        { fromId: userId, toId: session.user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">对话</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">{otherUser.name ?? otherUser.email ?? "OPC"}</h1>
      </section>
      <MessageThread
        currentUserId={session.user.id}
        initialMessages={messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))}
        action={sendMessage.bind(null, userId)}
        apiPath={`/api/messages/${userId}`}
      />
    </main>
  );
}
