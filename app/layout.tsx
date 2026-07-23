import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ClientShell } from '@/components/ClientShell';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Chronos AI — Calendar Planner',
  description: 'LLM-powered intelligent weekly calendar planner synced to Google Calendar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-dark-bg text-slate-100 min-h-screen flex flex-col font-sans antialiased">
        <Providers>
          <ClientShell>{children}</ClientShell>
        </Providers>
      </body>
    </html>
  );
}
