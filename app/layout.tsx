import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LelaModa Ops',
  description: 'LelaModa COD operations platform starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
