import { Banknote, CreditCard, Landmark, WalletCards } from "lucide-react";
import { ServicePage } from "@/components/services/ServicePage";

export default function BankingPage() {
  return (
    <ServicePage
      eyebrow="Banking service"
      title="OPC account opening, credit, settlement, and treasury matching"
      intro={[
        "Banking service coordination for OPC businesses that need account setup and financial product introductions.",
        "Offerings are partner-dependent and should be confirmed through the configured contact channel.",
      ]}
      features={[
        { icon: <Landmark size={20} />, title: "OPC account opening", description: "Partner bank account opening coordination and prerequisite document checks." },
        { icon: <CreditCard size={20} />, title: "Credit loans", description: "Initial matching for business credit products based on operating profile." },
        { icon: <Banknote size={20} />, title: "Payment settlement", description: "Collection, settlement, and reconciliation workflow consultation." },
        { icon: <WalletCards size={20} />, title: "Treasury allocation", description: "Basic cash management and wealth product matching for idle operating funds." },
      ]}
    />
  );
}
