import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      count: jest.fn().mockResolvedValue(12),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: "120000" } }),
    },
    user: {
      count: jest.fn().mockResolvedValue(8),
    },
  },
}));

describe("homepage", () => {
  it("renders the hero and service entries", async () => {
    render(await Home());

    expect(screen.getByRole("heading", { name: /让 OPC 公司更快找到服务/ })).toBeInTheDocument();
    expect(screen.getByText("订单广场")).toBeInTheDocument();
    expect(screen.getByText("累计订单")).toBeInTheDocument();
  });
});
