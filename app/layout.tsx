import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner" // Keep this for shadcn/ui toasts

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MindBloom - Where Student Minds Thrive",
  description: "AI-driven student support and well-being platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster /> {/* This is the shadcn/ui Toaster component */}
      </body>
    </html>
  )
}
