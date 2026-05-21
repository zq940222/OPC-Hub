import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, context: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { userId } = await context.params;
  if (session.user.id === userId) return NextResponse.json({ messages: [] });

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

  return NextResponse.json({
    messages: messages.map((message) => ({
      id: message.id,
      fromId: message.fromId,
      toId: message.toId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    })),
  });
}
