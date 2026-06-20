import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ClientProvider } from '@/providers/ClientProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'MedChain — Secure Healthcare Data Platform',
    template: '%s | MedChain',
  },
  description:
    'Blockchain-secured healthcare data management with consent-driven access, AI safety insights, and audit trails.',
  keywords: ['healthcare', 'blockchain', 'medical records', 'privacy', 'consent'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
