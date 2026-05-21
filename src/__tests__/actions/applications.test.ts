import { acceptApplication, applyToOrder } from "@/actions/applications";
import { auth } from "@/auth";
import { db } from "@/lib/db";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    orderApplication: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

function applicationForm(reason = "I can help") {
  const formData = new FormData();
  formData.set("reason", reason);
  return formData;
}

describe("application actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("applyToOrder rejects own order, non-recruiting order, duplicate application, and reason over 300 chars", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });

    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", authorId: "u1", status: "RECRUITING", applications: [] });
    await expect(applyToOrder("o1", {}, applicationForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", authorId: "author", status: "PENDING_REVIEW", applications: [] });
    await expect(applyToOrder("o1", {}, applicationForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({
      id: "o1",
      authorId: "author",
      status: "RECRUITING",
      applications: [{ applicantId: "u1" }],
    });
    await expect(applyToOrder("o1", {}, applicationForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", authorId: "author", status: "RECRUITING", applications: [] });
    await expect(applyToOrder("o1", {}, applicationForm("x".repeat(301)))).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    expect(mockDb.orderApplication.create).not.toHaveBeenCalled();
  });

  it("acceptApplication requires the order author and transitions order to IN_PROGRESS", async () => {
    mockAuth.mockResolvedValue({ user: { id: "author", role: "BIZ_OPC" } });
    (mockDb.orderApplication.findUnique as jest.Mock).mockResolvedValue({
      id: "a1",
      orderId: "o1",
      status: "PENDING",
      order: { id: "o1", authorId: "author", status: "RECRUITING" },
    });
    (mockDb.orderApplication.update as jest.Mock).mockResolvedValue({ id: "a1" });
    (mockDb.order.update as jest.Mock).mockResolvedValue({ id: "o1" });

    const result = await acceptApplication("a1");

    expect(result.success).toBe(true);
    expect(mockDb.orderApplication.update).toHaveBeenCalledWith({
      where: { id: "a1" },
      data: { status: "ACCEPTED" },
    });
    expect(mockDb.order.update).toHaveBeenCalledWith({
      where: { id: "o1" },
      data: { status: "IN_PROGRESS" },
    });
  });
});
