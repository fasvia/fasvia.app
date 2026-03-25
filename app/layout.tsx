'use client'

import { useEffect } from "react";
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeWrapper from '@/components/ui/ThemeWrapper';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const backListener = App.addListener('backButton', ({ canGoBack }: any) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      return () => {
        backListener.then((l: any) => l.remove());
      };
    }
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeWrapper>
          <div className="flex flex-col min-h-screen">
             <div className="flex-1">
                {children}
             </div>
             <p className="powered-by">Powered by Fasvia — Nelbion Group</p>
          </div>
        </ThemeWrapper>
      </body>
    </html>
  );
}
