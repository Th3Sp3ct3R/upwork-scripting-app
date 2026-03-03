import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "InstaGrowth – AI-Powered Instagram Growth",
  description: "Grow your Instagram on autopilot with AI-powered targeting, affinity analysis, and autonomous execution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
