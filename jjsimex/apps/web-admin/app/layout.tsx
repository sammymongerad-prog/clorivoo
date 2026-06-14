import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "JJ's IMEX — Panel Administrateur",
  description: 'Gestion des colis et clients JJ\'s IMEX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={sora.variable}>
      <body className="bg-brand-bg text-white font-sora antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
