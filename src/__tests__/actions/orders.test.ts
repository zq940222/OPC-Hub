import { createOrder, completeOrder } from "@/actions/orders";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ORDER_TAGS } from "@/lib/constants";
import { awardPoints } from "@/lib/points";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("@/lib/points", () => ({ awardPoints: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

function orderForm(overrides?: Record<string, string | string[]>) {
  const formData = new FormData();
  formData.set("title", "  Build landing page  ");
  formData.set("description", "  Need a polished page  ");
  formData.set("amount", "1200");
  formData.set("category", "design");
  formData.set("contact", "wechat");
  formData.set("deadline", "2026-06-01");
  for (const tag of [ORDER_TAGS[0], ORDER_TAGS[1], "unknown", ORDER_TAGS[2], ORDER_TAGS[3], ORDER_TAGS[4], ORDER_TAGS[5]]) {
    formData.append("tags", tag);
  }

  for (const [key, value] of Object.entries(overrides ?? {})) {
    formData.delete(key);
    if (Array.isArray(value)) {
      for (const item of value) formData.append(key, item);
    } else {
      formData.set(key, value);
    }
  }

  return formData;
}

describe("order actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("createOrder rejects unauthenticated users", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createOrder({}, orderForm());

    expect(result.error).toBeTruthy();
    expect(mockDb.order.create).not.toHaveBeenCalled();
  });

  it("createOrder rejects OPC users and allows only BIZ_OPC", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });

    const rejected = await createOrder({}, orderForm());

    expect(rejected.error).toBeTruthy();
    expect(mockDb.order.create).not.toHaveBeenCalled();

    mockAuth.mockResolvedValue({ user: { id: "u1", role: "BIZ_OPC" } });
    (mockDb.order.create as jest.Mock).mockResolvedValue({ id: "o1" });

    const created = await createOrder({}, orderForm());

    expect(created.success).toBe(true);
    expect(mockDb.order.create).toHaveBeenCalled();
  });

  it("createOrder trims tags to known tags and max 5", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "BIZ_OPC" } });
    (mockDb.order.create as jest.Mock).mockResolvedValue({ id: "o1" });

    await createOrder({}, orderForm());

    expect(mockDb.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: "Build landing page",
        description: "Need a polished page",
        status: "PENDING_REVIEW",
        authorId: "u1",
        tags: [ORDER_TAGS[0], ORDER_TAGS[1], ORDER_TAGS[2], ORDER_TAGS[3], ORDER_TAGS[4]],
      }),
    });
  });

  it("completeOrder requires author, requires IN_PROGRESS, sets COMPLETED, and awards accepted applicant", async () => {
    mockAuth.mockResolvedValue({ user: { id: "author", role: "BIZ_OPC" } });
    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({
      id: "o1",
      authorId: "author",
      status: "IN_PROGRESS",
      applications: [{ applicantId: "applicant", status: "ACCEPTED" }],
    });
    (mockDb.order.update as jest.Mock).mockResolvedValue({ id: "o1" });

    const result = await completeOrder("o1");

    expect(result.success).toBe(true);
    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { status: "COMPLETED" },
    });
    expect(awardPoints).toHaveBeenCalledWith("applicant", 100, "complete_order");
  });
});
