import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Inter_Tight } from "next/font/google";
import { AppLayout } from "@/components/layout/app-layout";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xtreme Signals - Technical Indicator Extremes",
  description: "Premium stock market analysis tool for finding extreme technical indicators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${plusJakarta.variable} ${interTight.variable} font-sans antialiased`}
      >
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
