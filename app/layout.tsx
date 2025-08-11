// app/layout.tsx

import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import "./globals.css";

import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from "@/components/Navbar"
import { Toaster } from 'sonner'

// ✅ NEW: add the conflict modal (client component)
import { PurchaseConflictModal } from '@/components/PurchaseConflictModal'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
});

const pacifico = Pacifico({ 
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico'
});

export const metadata: Metadata = {
  title: "immigreat.ai - Your Immigration Education Partner",
  description: "Comprehensive courses and guidance for your US immigration journey",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
    <ClerkProvider>
      <html lang="en" className={pacifico.variable}>
        <body className={`${inter.className} antialiased`}>
          <Navbar />

          {/* keep original spacing for your fixed navbar */}
          <main className="pt-20">
            {children}
          </main>

          {/* keep original toaster styling/position */}
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'backdrop-blur-md bg-white/90 border-purple-100',
              duration: 1500,
            }}
            richColors
          />

          {/* ✅ NEW: mounted once at root; opens only when cart has conflicts */}
          <PurchaseConflictModal />
        </body>
      </html>
    </ClerkProvider>
  );
}
