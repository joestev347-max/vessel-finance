import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BugReporter } from "@/components/debug/BugReporter";

export const metadata: Metadata = {
  title: "Vessel Finance",
  description: "Maritime fleet financial management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 flex flex-col">{children}</main>
        </div>
        <BugReporter />
      </body>
    </html>
  );
}
