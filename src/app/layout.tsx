import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "warp.green Attestations",
  description: "warp.green Automated Attestation Verification Service",
  icons: [
    '/warp-green-icon.png'
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-blacl"}>{children}</body>
    </html>
  );
}
