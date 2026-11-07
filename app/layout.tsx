import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMAGO Marketing | Principal-led marketing & PR",
  description:
    "Clear marketing and PR direction for organizations at a turning point."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
