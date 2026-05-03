import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Script from "next/script";
import LangProvider from "@/components/LangProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { LemonSqueezyProvider } from "@/components/billing/LemonSqueezyProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RealvsAi — Dashboard",
  description: "Your AI media authenticity scanner dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en" dir="ltr" className="dark">
        <body className={`${inter.className} min-h-screen bg-bg text-text antialiased`}>
          <ToastProvider>
            <LangProvider>
              <LemonSqueezyProvider />
              {children}
            </LangProvider>
          </ToastProvider>
          <Script
            src="https://app.lemonsqueezy.com/js/lemon.js"
            defer
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
