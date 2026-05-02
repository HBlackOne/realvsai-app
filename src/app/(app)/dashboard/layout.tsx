import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — RealvsAI",
  description: "Detect AI-generated media in seconds.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
