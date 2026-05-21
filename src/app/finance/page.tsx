import { Calculator, FileText, ReceiptText, ShieldCheck } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function FinancePage() {
  return (
    <ServicePage
      eyebrow="Finance service"
      title="Bookkeeping, tax filing, audit, and invoice operations"
      intro={[
        "Finance support for OPC teams that need predictable monthly operations without building an internal finance desk.",
        "Use this page as the service catalogue entry point; contact details are configured through public environment variables.",
      ]}
      features={[
        { icon: <Calculator size={20} />, title: "Bookkeeping", description: "Monthly account organization, voucher review, and management reports for routine finance work." },
        { icon: <ReceiptText size={20} />, title: "Tax filing", description: "Recurring tax declaration support, deadline tracking, and risk reminders." },
        { icon: <ShieldCheck size={20} />, title: "Annual audit", description: "Year-end audit preparation, document collection, and issue follow-up." },
        { icon: <FileText size={20} />, title: "Invoice management", description: "Invoice process setup, data reconciliation, and exception handling." },
      ]}
    />
  );
}
