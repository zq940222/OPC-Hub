import { awardPoints } from "@/lib/points";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn((ops) => Promise.all(ops)),
    user: { update: jest.fn() },
    pointLog: { create: jest.fn() },
  },
}));

it("increments user points and writes PointLog", async () => {
  await awardPoints("u1", 10, "鍙戝笘");

  expect(db.user.update).toHaveBeenCalledWith({
    where: { id: "u1" },
    data: { points: { increment: 10 } },
  });
  expect(db.pointLog.create).toHaveBeenCalledWith({
    data: { userId: "u1", delta: 10, reason: "鍙戝笘" },
  });
});
