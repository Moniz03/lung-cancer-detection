import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lung Cancer Detection and Classification',
  description: 'Upload and classify lung images for cancer detection',
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-lung-image bg-cover bg-center bg-no-repeat bg-fixed overflow-hidden`}>
        <div className="min-h-screen backdrop-blur-sm bg-white/30 overflow-auto">
          {children}
        </div>
      </body>
    </html>
  )
}



import './globals.css'