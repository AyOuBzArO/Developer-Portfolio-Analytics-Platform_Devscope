import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'DevScope — AI GitHub Portfolio Analyzer',
  description: 'Objectively score your GitHub profile with AI-powered insights, recruiter-ready recommendations, and detailed portfolio analysis.',
  icons: {
    icon: '/logo.jpeg',
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  openGraph: {
    title: 'DevScope — AI GitHub Portfolio Analyzer',
    description: 'Objectively score your GitHub profile with AI-powered insights and recruiter-ready recommendations.',
    images: [{ url: '/logo.jpeg', width: 512, height: 512, alt: 'DevScope' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
