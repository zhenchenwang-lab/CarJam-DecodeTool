import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Play List Decoder',
  description: 'Car Jam 玩家步骤记录解码工具。',
  metadataBase: siteUrl ? new URL(siteUrl) : undefined,
  openGraph: {
    title: 'Play List Decoder',
    description: 'Car Jam 玩家步骤记录解码工具。',
    images: ['/social-preview.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
