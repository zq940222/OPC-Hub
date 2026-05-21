import { createTool, updateTool } from "@/actions/admin-tools";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

jest.mock("@/lib/admin-session", () => ({ getAdminSession: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    admin: { findUnique: jest.fn() },
    tool: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAdminSession = getAdminSession as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

function toolForm(overrides?: Record<string, string>) {
  const formData = new FormData();
  formData.set("name", "Tool");
  formData.set("description", "Useful tool");
  formData.set("category", "AI Tools");
  formData.set("url", "https://example.com");
  formData.set("iconUrl", "");
  formData.set("order", "10");
  for (const [key, value] of Object.entries(overrides ?? {})) {
    formData.set(key, value);
  }
  return formData;
}

function mockSubAdmin(permissions: Record<string, boolean>) {
  mockAdminSession.mockResolvedValue({ id: "sub1", role: "SUB_ADMIN" });
  (mockDb.admin.findUnique as jest.Mock).mockResolvedValue({
    id: "sub1",
    role: "SUB_ADMIN",
    subAccount: { permissions },
  });
}

function mockAdmin() {
  mockAdminSession.mockResolvedValue({ id: "admin1", role: "ADMIN" });
  (mockDb.admin.findUnique as jest.Mock).mockResolvedValue({
    id: "admin1",
    role: "ADMIN",
    subAccount: null,
  });
}

describe("admin tool actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sub-admin without tools cannot create/update tools", async () => {
    mockSubAdmin({ users: true, orders: true, content: true, tools: false, announcements: false });

    await expect(createTool({}, toolForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));
    await expect(updateTool("t1", {}, toolForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(mockDb.tool.create).not.toHaveBeenCalled();
    expect(mockDb.tool.update).not.toHaveBeenCalled();
  });

  it("admin can create tools", async () => {
    mockAdmin();
    (mockDb.tool.create as jest.Mock).mockResolvedValue({ id: "t1" });

    await expect(createTool({}, toolForm())).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.tool.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "Tool",
        description: "Useful tool",
        category: "AI Tools",
        url: "https://example.com",
        order: 10,
      }),
    });
  });
});
