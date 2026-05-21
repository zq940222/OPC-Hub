import { toggleFollow } from "@/actions/follow";
import { updateProfile } from "@/actions/profile";
import { auth } from "@/auth";
import { db } from "@/lib/db";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    opcProfile: {
      upsert: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

function profileForm(overrides?: Record<string, string | string[]>) {
  const formData = new FormData();
  formData.set("bio", "Short bio");
  formData.set("website", "https://example.com");
  formData.set("location", "Shanghai");
  formData.set("name", "OPC Studio");
  formData.set("image", "https://example.com/avatar.png");
  formData.append("skills", "AI");
  formData.append("skills", "Tax");

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

describe("profile actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("rejects unauthenticated profile update", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateProfile({}, profileForm());

    expect(result.error).toBeTruthy();
    expect(mockDb.opcProfile.upsert).not.toHaveBeenCalled();
  });

  it("caps bio at 300 chars", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });

    const result = await updateProfile({}, profileForm({ bio: "x".repeat(301) }));

    expect(result.error).toBeTruthy();
    expect(mockDb.opcProfile.upsert).not.toHaveBeenCalled();
  });

  it("caps skills at 8", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });
    (mockDb.opcProfile.upsert as jest.Mock).mockResolvedValue({ id: "p1" });
    (mockDb.user.update as jest.Mock).mockResolvedValue({ id: "u1" });

    await updateProfile({}, profileForm({ skills: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] }));

    expect(mockDb.opcProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ skills: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] }),
      }),
    );
  });

  it("rejects invalid website URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });

    const result = await updateProfile({}, profileForm({ website: "notaurl" }));

    expect(result.error).toBeTruthy();
    expect(mockDb.opcProfile.upsert).not.toHaveBeenCalled();
  });

  it("rejects self-follow and toggles follow rows", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });

    await expect(toggleFollow("u1")).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.user.findUnique as jest.Mock).mockResolvedValue({ id: "u2" });
    (mockDb.follow.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(toggleFollow("u2")).resolves.toEqual(expect.objectContaining({ success: true, following: true }));
    expect(mockDb.follow.create).toHaveBeenCalledWith({
      data: { followerId: "u1", followingId: "u2" },
    });

    (mockDb.follow.findUnique as jest.Mock).mockResolvedValue({ followerId: "u1", followingId: "u2" });
    await expect(toggleFollow("u2")).resolves.toEqual(expect.objectContaining({ success: true, following: false }));
    expect(mockDb.follow.delete).toHaveBeenCalledWith({
      where: { followerId_followingId: { followerId: "u1", followingId: "u2" } },
    });
  });
});
