import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { Toaster as UIToaster } from "@/components/ui/toaster"


const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Diamond Health - Phòng khám đa khoa uy tín",
  description: "Đặt lịch khám nhanh - Chăm sóc sức khỏe toàn diện - Đội ngũ bác sĩ chuyên môn cao",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
          <Analytics />
          <Toaster />
          <UIToaster />
        </Suspense>
      </body>
    </html>
  )
}
