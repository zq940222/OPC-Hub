import { register } from "@/actions/auth";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe("register action", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns error when email already exists", async () => {
    (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ id: "1" });
    const result = await register({ email: "a@b.com", password: "pass123", name: "Test" });
    expect(result.error).toBe("该邮箱已注册");
  });

  it("hashes password and creates user on success", async () => {
    (mockDb.user.findUnique as jest.Mock).mockResolvedValue(null);
    (mockDb.user.create as jest.Mock).mockResolvedValue({ id: "2", email: "a@b.com" });
    const result = await register({ email: "a@b.com", password: "pass123", name: "Test" });
    expect(result.success).toBe(true);
    const created = (mockDb.user.create as jest.Mock).mock.calls[0][0];
    expect(created.data.password).not.toBe("pass123");
    expect(created.data.role).toBe("OPC");
  });
});
