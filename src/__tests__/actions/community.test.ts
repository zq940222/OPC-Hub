import {
  createComment,
  createPost,
  likePost,
  reportContent,
  togglePostFeatured,
} from "@/actions/community";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { awardPoints } from "@/lib/points";

jest.mock("@/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/admin-session", () => ({ getAdminSession: jest.fn() }));
jest.mock("@/lib/points", () => ({ awardPoints: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    board: { findUnique: jest.fn() },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    comment: { create: jest.fn() },
    postLike: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    report: { create: jest.fn() },
  },
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockAuth = auth as unknown as jest.Mock;
const mockAdminSession = getAdminSession as jest.Mock;
const mockDb = db as jest.Mocked<typeof db>;

function postForm(overrides?: Record<string, string>) {
  const formData = new FormData();
  formData.set("boardId", "b1");
  formData.set("title", "Helpful post");
  formData.set("content", "Useful content");
  for (const [key, value] of Object.entries(overrides ?? {})) {
    formData.set(key, value);
  }
  return formData;
}

describe("community actions", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creating a post requires login, valid board, title <= 80, non-empty content, and awards +10", async () => {
    mockAuth.mockResolvedValue(null);
    await expect(createPost({}, postForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });
    (mockDb.board.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(createPost({}, postForm())).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.board.findUnique as jest.Mock).mockResolvedValue({ id: "b1", slug: "qa" });
    await expect(createPost({}, postForm({ title: "x".repeat(81) }))).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));
    await expect(createPost({}, postForm({ content: "" }))).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    (mockDb.post.create as jest.Mock).mockResolvedValue({ id: "p1", board: { slug: "qa" } });
    await expect(createPost({}, postForm())).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(awardPoints).toHaveBeenCalledWith("u1", 10, "create_post");
  });

  it("commenting requires login, non-empty content, and awards +3", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });
    (mockDb.post.findUnique as jest.Mock).mockResolvedValue({ id: "p1", board: { slug: "qa" } });

    const emptyForm = new FormData();
    emptyForm.set("content", "");
    await expect(createComment("p1", {}, emptyForm)).resolves.toEqual(expect.objectContaining({ error: expect.any(String) }));

    const formData = new FormData();
    formData.set("content", "Thanks");
    (mockDb.comment.create as jest.Mock).mockResolvedValue({ id: "c1" });
    await expect(createComment("p1", {}, formData)).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(awardPoints).toHaveBeenCalledWith("u1", 3, "create_comment");
  });

  it("liking a post creates PostLike, increments likeCount, and awards +2 to post author once", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });
    (mockDb.post.findUnique as jest.Mock).mockResolvedValue({ id: "p1", authorId: "author", board: { slug: "qa" } });
    (mockDb.postLike.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(likePost("p1")).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.postLike.create).toHaveBeenCalledWith({
      data: { userId: "u1", postId: "p1" },
    });
    expect(mockDb.post.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { likeCount: { increment: 1 } },
    });
    expect(awardPoints).toHaveBeenCalledWith("author", 2, "post_liked");

    jest.clearAllMocks();
    (mockDb.post.findUnique as jest.Mock).mockResolvedValue({ id: "p1", authorId: "author", board: { slug: "qa" } });
    (mockDb.postLike.findUnique as jest.Mock).mockResolvedValue({ userId: "u1", postId: "p1" });
    await likePost("p1");
    expect(awardPoints).not.toHaveBeenCalled();
  });

  it("reporting creates Report for target type POST or COMMENT", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } });
    const formData = new FormData();
    formData.set("reason", "spam");

    await expect(reportContent("POST", "p1", {}, formData)).resolves.toEqual(expect.objectContaining({ success: true }));
    expect(mockDb.report.create).toHaveBeenCalledWith({
      data: { reporterId: "u1", targetType: "POST", targetId: "p1", reason: "spam" },
    });
  });

  it("admin feature action sets isFeatured and awards +50", async () => {
    mockAdminSession.mockResolvedValue({ id: "a1", role: "ADMIN" });
    (mockDb.post.findUnique as jest.Mock).mockResolvedValue({ id: "p1", authorId: "author", isFeatured: false, board: { slug: "qa" } });
    (mockDb.post.update as jest.Mock).mockResolvedValue({ id: "p1", isFeatured: true });

    await expect(togglePostFeatured("p1")).resolves.toEqual(expect.objectContaining({ success: true }));

    expect(mockDb.post.update).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: { isFeatured: true },
    });
    expect(awardPoints).toHaveBeenCalledWith("author", 50, "post_featured");
  });
});
