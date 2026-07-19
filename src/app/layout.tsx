import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SubScript | Soroban Decentralized Recurring Subscriptions',
  description: 'Automated recurring billing management dApp on Stellar Testnet for SaaS apps & digital creators.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0b0f19] text-slate-100">{children}</body>
    </html>
  );
}
