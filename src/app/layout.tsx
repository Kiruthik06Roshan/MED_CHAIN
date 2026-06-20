import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "VORTEXA - Patient-Sovereign Health Network",
  description:
    "Patient-owned health vault with cryptographic consent and AI safety checks",
  keywords: ["healthcare", "blockchain", "prescriptions", "medical records"],
  authors: [{ name: "VORTEXA Team" }],
  openGraph: {
    title: "VORTEXA - Patient-Sovereign Health Network",
    description:
      "Patient-owned health vault with cryptographic consent and AI safety checks",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} min-h-screen bg-slate-900 text-white antialiased`}
      >
        <Providers>{children}</Providers>
        <Toaster richColors closeButton theme="dark" />
      </body>
    </html>
  );
}
