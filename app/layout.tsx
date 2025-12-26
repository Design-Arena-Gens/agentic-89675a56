import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chess Coach Finder - AI Agent",
  description: "Find chess academies and coaches worldwide with automated outreach",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
