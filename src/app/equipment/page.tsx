import { Camera, Monitor, PackageCheck, Wrench } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function EquipmentPage() {
  return (
    <ServicePage
      eyebrow="Equipment rental"
      title="Office, camera, production, and short-term equipment rental"
      intro={[
        "Equipment rental coordination for OPC teams that need temporary capacity without buying assets upfront.",
        "The page lists common service directions; exact inventory and pricing should be confirmed through the contact channel.",
      ]}
      features={[
        { icon: <Monitor size={20} />, title: "Office equipment", description: "Computers, monitors, printers, and meeting equipment for temporary workspaces." },
        { icon: <Camera size={20} />, title: "Camera gear", description: "Cameras, lights, microphones, and content production support gear." },
        { icon: <Wrench size={20} />, title: "Production tools", description: "Project-based tool rental for small production and operations needs." },
        { icon: <PackageCheck size={20} />, title: "On-demand short rental", description: "Short rental coordination, delivery expectations, and return handling." },
      ]}
    />
  );
}
