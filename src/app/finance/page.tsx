import { Calculator, FileText, ReceiptText, ShieldCheck } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function FinancePage() {
  return (
    <ServicePage
      eyebrow="财务服务"
      title="记账、报税、审计与发票运营"
      intro={[
        "为不搭建内部财务岗位、但需要稳定月度运营的 OPC 团队提供财务支持。",
        "本页作为服务目录入口，联系方式通过公开环境变量配置。",
      ]}
      features={[
        { icon: <Calculator size={20} />, title: "代理记账", description: "月度账务整理、凭证复核和经营报表支持。" },
        { icon: <ReceiptText size={20} />, title: "纳税申报", description: "周期性税务申报、期限跟踪和风险提醒。" },
        { icon: <ShieldCheck size={20} />, title: "年度审计", description: "年审准备、资料收集和问题跟进。" },
        { icon: <FileText size={20} />, title: "发票管理", description: "发票流程搭建、数据核对和异常处理。" },
      ]}
    />
  );
}
