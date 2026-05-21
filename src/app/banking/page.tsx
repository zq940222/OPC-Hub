import { Banknote, CreditCard, Landmark, WalletCards } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function BankingPage() {
  return (
    <ServicePage
      eyebrow="银行服务"
      title="OPC 开户、授信、结算与资金方案匹配"
      intro={[
        "为需要开户、金融产品引荐和资金管理支持的 OPC 企业提供银行服务协调。",
        "具体服务依赖合作方资源，办理前请通过页面配置的联系方式确认。",
      ]}
      features={[
        { icon: <Landmark size={20} />, title: "OPC 银行开户", description: "协调合作银行开户流程，并核对开户前置材料。" },
        { icon: <CreditCard size={20} />, title: "授信贷款", description: "根据经营画像初步匹配企业授信与贷款产品。" },
        { icon: <Banknote size={20} />, title: "收付结算", description: "提供收款、结算、对账流程咨询。" },
        { icon: <WalletCards size={20} />, title: "资金配置", description: "为闲置经营资金匹配基础现金管理与理财方案。" },
      ]}
    />
  );
}
