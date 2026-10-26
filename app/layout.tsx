import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { IBM_Plex_Mono, Shantell_Sans } from 'next/font/google'
import Notebook from '@/components/Notebook'
import '@/styles/base.css'
import '@/styles/notebook.css'
import '@/styles/objects.css'
import '@/styles/page.css'
import '@/styles/home.css'
import '@/styles/orbitals.css'
import '@/styles/algos.css'

// a marker hand with an informality axis, set halfway between a clean sans and handwriting
const hand = Shantell_Sans({ subsets: ['latin'], axes: ['INFM'], variable: '--font-hand' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

// the home page is set in the reference's two engraving faces: a serif to name things, a sans to say them
const serif = localFont({
  src: [
    { path: '../public/fonts/KevinSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/KevinSerif-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
})
const sans = localFont({
  src: '../public/fonts/KevinSans-Regular.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://eleow.com'),
  title: 'Elliott Leow',
  description: 'Elliott Leow. Biomedical engineering and computer science at Johns Hopkins. Medical devices and AI in healthcare.',
  icons: { icon: '/favicon.png' },
  openGraph: { title: 'Elliott Leow', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#f3eee1', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hand.variable} ${mono.variable} ${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <body>
        <Notebook>{children}</Notebook>
      </body>
    </html>
  )
}
