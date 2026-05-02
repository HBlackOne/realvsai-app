import { AppPage, AppPageHeader } from "@/components/app-shell/AppPage";
import { SettingsClient } from "./_client";

export default function SettingsPage() {
  return (
    <AppPage className="max-w-2xl">
      <AppPageHeader
        title="Settings"
        description="Manage the parts of your account that are available now. More settings will appear here as your account setup expands."
      />

      <div className="mt-8">
        <SettingsClient />
      </div>
    </AppPage>
  );
}
