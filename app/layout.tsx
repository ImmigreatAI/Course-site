// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Pacifico } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from "@/components/Navbar";
import { Toaster } from 'sonner'

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={pacifico.variable}>
        <body className={`${inter.className} antialiased`}>
          <Navbar />
          <main className="pt-20">
            {children}
          </main>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'backdrop-blur-md bg-white/90 border-purple-100',
              duration: 3000,
            }}
            richColors
          />
        </body>
      </html>
    </ClerkProvider>
  );
}