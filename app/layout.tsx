import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CookingRescue — You Can Cook Tonight',
  description:
    'Simple microwave meals for international students and workers far from home. No chef. No kitchen. No problem.',
  openGraph: {
    title: 'CookingRescue — You Can Cook Tonight',
    description: 'Even far from home, you can eat well. Free recipes, tools and guides.',
    url: 'https://cookingrescue.com',
    siteName: 'CookingRescue',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#E9E9E9] text-black">{children}</body>
    </html>
  );
}
