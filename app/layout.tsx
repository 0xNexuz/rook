import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://rook-xreyys-projects.vercel.app'),
  title: 'Rook — Programmable markets on Robinhood Chain',
  description: 'Create, simulate, and safely activate market automation strategies for tokenized stocks and crypto on Robinhood Chain.',
  openGraph: {
    title: 'Rook — Command the move',
    description: 'Programmable Web3 market positions with visible rules, bounded permissions, and owner-controlled execution on Robinhood Chain.',
    images: [{ url: '/og.png', width: 1536, height: 864, alt: 'Rook programmable markets' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rook — Command the move',
    description: 'Programmable Web3 market positions on Robinhood Chain.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
