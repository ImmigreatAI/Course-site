// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from '@/components/Navbar'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link 
            href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" 
            rel="stylesheet" 
          />
        </head>
        <body>
          <Navbar />
          <main>
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  )
}