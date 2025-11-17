import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Multi-Tenant Board',
  description: 'Collaborative task management board with real-time updates',
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
