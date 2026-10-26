import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import '@/styles/base.css'
import '@/styles/objects.css'
import '@/styles/page.css'
import '@/styles/orbitals.css'
import '@/styles/algos.css'
import '@/styles/site.css'
import Life from '@/components/site/Life'

// (kept only for code and the algorithm tables inside notes, where letters must line up)
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-code', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://eleow.com'),
  title: { default: 'Elliott Leow', template: '%s · Elliott Leow' },
  description: 'Elliott Leow. Biomedical engineering and computer science at Johns Hopkins. Medical devices and AI in healthcare.',
  icons: { icon: '/favicon.png' },
  openGraph: { title: 'Elliott Leow', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#faf9f6', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable} suppressHydrationWarning>
      <head>
        {/* (with script, things wait out of sight to draw themselves in; without it, they're simply there) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preload" href="/fonts/LeowSerif-Bold.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/LeowSerif-Regular.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/LeowSans-Regular.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}<Life /></body>
    </html>
  )
}
