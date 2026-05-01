import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trainer",
  description: "Youth training and performance tracking platform"
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
