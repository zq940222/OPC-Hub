import { db } from "@/lib/db";

async function fetchStats() {
  const [orderCount, orderAmount, companyCount] = await Promise.all([
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    db.user.count({ where: { role: { in: ["OPC", "BIZ_OPC"] } } }),
  ]);

  return {
    orderCount,
    orderAmount: Number(orderAmount._sum.amount ?? 0),
    companyCount,
    events: ["New order entered review", "OPC company submitted application", "Finance provider updated schedule"],
  };
}

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const cleanup = () => {
    if (interval) clearInterval(interval);
    interval = undefined;
    closed = true;
  };

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const stats = await fetchStats();
          if (!closed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`));
          }
        } catch {
          if (!closed) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ orderCount: 0, orderAmount: 0, companyCount: 0, events: [] })}\n\n`,
              ),
            );
          }
        }
      };

      await send();
      interval = setInterval(send, 10_000);
      req.signal.addEventListener("abort", () => {
        if (!closed) {
          cleanup();
          controller.close();
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
