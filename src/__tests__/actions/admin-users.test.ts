import { resolveReport } from "@/actions/admin-content";
import { toggleUserBanned, updateUserRole } from "@/actions/admin-users";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

jest.mock("@/lib/admin-session", () => ({ getAdminSession: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    admin: { findUnique: jest.fn() },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    report: { update: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAdminSession = getAdminSession as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

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

describe("admin user/content actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("sub-admin without users cannot change roles or ban users", async () => {
    mockSubAdmin({ users: false, orders: true, content: true, tools: false, announcements: false });

    await expect(updateUserRole("u1", "BIZ_OPC")).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));
    await expect(toggleUserBanned("u1")).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));
    expect(mockDb.user.update).not.toHaveBeenCalled();
  });

  it("admin can toggle User.banned", async () => {
    mockAdmin();
    (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ id: "u1", banned: false });
    (mockDb.user.update as jest.Mock).mockResolvedValue({ id: "u1", banned: true });

    await expect(toggleUserBanned("u1")).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { banned: true },
    });
  });

  it("admin can switch user role between OPC and BIZ_OPC", async () => {
    mockAdmin();
    (mockDb.user.update as jest.Mock).mockResolvedValue({ id: "u1", role: "BIZ_OPC" });

    await expect(updateUserRole("u1", "BIZ_OPC")).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { role: "BIZ_OPC" },
    });
  });

  it("admin can mark reports resolved", async () => {
    mockAdmin();
    (mockDb.report.update as jest.Mock).mockResolvedValue({ id: "r1", resolved: true });

    await expect(resolveReport("r1")).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.report.update).toHaveBeenCalledWith({
      where: { id: "r1" },
      data: { resolved: true },
    });
  });
});
