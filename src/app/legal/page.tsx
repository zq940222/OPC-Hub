import { BadgeCheck, Copyright, FileSignature, Scale } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function LegalPage() {
  return (
    <ServicePage
      eyebrow="法务服务"
      title="合同、工商变更、知识产权与纠纷支持"
      intro={[
        "为处理合作、供应商、客户和合规敏感流程的 OPC 公司提供法务支持。",
        "当前版本保持需求路径简洁：先确认服务范围，再联系平台团队。",
      ]}
      features={[
        { icon: <FileSignature size={20} />, title: "合同起草与审核", description: "常见业务协议起草、条款审核和实务风险提示。" },
        { icon: <BadgeCheck size={20} />, title: "注册与变更", description: "公司注册、工商变更和配套材料准备。" },
        { icon: <Copyright size={20} />, title: "知识产权", description: "面向小团队的商标、版权和内容权属咨询。" },
        { icon: <Scale size={20} />, title: "纠纷咨询", description: "合作纠纷轻量分诊和升级处理准备。" },
      ]}
    />
  );
}
