import { ModulePage, PrimaryLink } from "@/components/layout/ModulePage";

export default function OrdersPage() {
  return (
    <ModulePage
      eyebrow="订单广场"
      title="发现需求并报名承接"
      description="支持按行业、金额、状态和截止日期筛选订单；本期先完成权限入口，订单 CRUD 在后续计划实现。"
      actions={<PrimaryLink href="/orders/new">发布订单</PrimaryLink>}
    />
  );
}
