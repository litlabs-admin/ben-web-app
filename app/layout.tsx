import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Client Command Center",
  description: "White-labeled PR and marketing performance dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
