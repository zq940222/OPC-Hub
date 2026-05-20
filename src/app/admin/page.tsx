import { ModulePage } from "@/components/layout/ModulePage";

export default function AdminPage() {
  return (
    <ModulePage
      eyebrow="管理后台"
      title="用户、订单、内容与工具配置"
      description="管理员可审核订单、管理用户与子账号权限、维护工具配置和平台公告。"
    />
  );
}
