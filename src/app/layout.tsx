import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Container Ledger — agricultural import ERP',
  description: 'Per-container cost, quality and margin tracking for produce importers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
