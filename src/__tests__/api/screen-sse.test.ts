/**
 * @jest-environment node
 */

import { GET } from "@/app/api/screen/sse/route";

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      count: jest.fn().mockResolvedValue(42),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: "500000" } }),
    },
    user: {
      count: jest.fn().mockResolvedValue(10),
    },
  },
}));

describe("GET /api/screen/sse", () => {
  it("returns a readable SSE response", async () => {
    const controller = new AbortController();
    const req = new Request("http://localhost/api/screen/sse", {
      signal: controller.signal,
    });
    const res = await GET(req);
    const reader = res.body?.getReader();
    await reader?.read();
    await reader?.cancel();
    controller.abort();

    expect(res.headers.get("content-type")).toBe("text/event-stream");
    expect(res.headers.get("cache-control")).toContain("no-cache");
    expect(res.body).toBeTruthy();
  });
});
