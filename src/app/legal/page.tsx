import { BadgeCheck, Copyright, FileSignature, Scale } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function LegalPage() {
  return (
    <ServicePage
      eyebrow="Legal service"
      title="Contracts, corporate changes, IP, and dispute support"
      intro={[
        "Legal support for OPC companies handling collaborations, vendors, clients, and compliance-sensitive workflows.",
        "The v1 service page keeps the request path simple: review the scope, then contact the platform team.",
      ]}
      features={[
        { icon: <FileSignature size={20} />, title: "Contract drafting and review", description: "Drafting, clause review, and practical risk notes for common business agreements." },
        { icon: <BadgeCheck size={20} />, title: "Registration and changes", description: "Company registration, change filings, and supporting document preparation." },
        { icon: <Copyright size={20} />, title: "Intellectual property", description: "Trademark, copyright, and content ownership consultation for small teams." },
        { icon: <Scale size={20} />, title: "Dispute consultation", description: "Lightweight triage for collaboration disputes and escalation preparation." },
      ]}
    />
  );
}
