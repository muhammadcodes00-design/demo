import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InvortechDS — Admin Panel",
  description: "InvortechDS Dental Supplies Admin Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
