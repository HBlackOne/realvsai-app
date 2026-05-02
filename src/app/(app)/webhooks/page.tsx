import { Bell } from "lucide-react";
import PremiumStub from "@/components/PremiumStub";
export default function WebhooksPage() {
  return <PremiumStub icon={<Bell className="h-8 w-8 text-warning" />} title="Webhooks" desc="Configure webhook notifications for scan events" />;
}
