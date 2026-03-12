import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'GuideHands | MultiModal UI Navigation Assistant',
  description: 'Navigate digital workflows with ease using Gemini AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  )
}
