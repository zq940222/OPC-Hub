import "server-only";
import { db } from "@/lib/db";

export async function awardPoints(userId: string, delta: number, reason: string) {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: { increment: delta } },
    }),
    db.pointLog.create({
      data: { userId, delta, reason },
    }),
  ]);
}
