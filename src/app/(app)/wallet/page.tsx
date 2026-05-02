import { Wallet } from "lucide-react";
import PremiumStub from "@/components/PremiumStub";
export default function WalletPage() {
  return <PremiumStub icon={<Wallet className="h-8 w-8 text-warning" />} title="Wallet" desc="View your balance, transactions, and payment history" />;
}
