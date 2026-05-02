import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import LangProvider from "@/components/LangProvider";
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
          <LangProvider>{children}</LangProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
