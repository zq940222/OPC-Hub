import { Camera, Monitor, PackageCheck, Wrench } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function EquipmentPage() {
  return (
    <ServicePage
      eyebrow="设备租赁"
      title="办公、拍摄、生产与短租设备支持"
      intro={[
        "为不想提前购置资产、但需要临时产能的 OPC 团队协调设备租赁资源。",
        "页面展示常见服务方向，具体库存与价格请通过联系方式确认。",
      ]}
      features={[
        { icon: <Monitor size={20} />, title: "办公设备", description: "临时办公场景所需的电脑、显示器、打印机和会议设备。" },
        { icon: <Camera size={20} />, title: "拍摄器材", description: "相机、灯光、麦克风及内容生产配套器材。" },
        { icon: <Wrench size={20} />, title: "生产工具", description: "面向小型生产和运营项目的工具租赁。" },
        { icon: <PackageCheck size={20} />, title: "按需短租", description: "短租协调、配送预期和归还处理支持。" },
      ]}
    />
  );
}
