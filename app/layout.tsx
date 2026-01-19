import type { Metadata } from "next";
import { Inter, Merriweather } from 'next/font/google'
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Foreseen - AI Intelligence Platform",
  description: "Enterprise AI news intelligence and synthesis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
