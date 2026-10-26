import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { IBM_Plex_Mono } from 'next/font/google'
import Notebook from '@/components/Notebook'
import '@/styles/base.css'
import '@/styles/notebook.css'
import '@/styles/objects.css'
import '@/styles/page.css'
import '@/styles/orbitals.css'
import '@/styles/algos.css'

const serif = localFont({
  src: [
    { path: '../public/fonts/KevinSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/KevinSerif-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
})
const sans = localFont({
  src: [
    { path: '../public/fonts/KevinSans-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/KevinSans-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})
const code = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-code', weight: ['400', '500'] })

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
    <html lang="en" className={`${serif.variable} ${sans.variable} ${code.variable}`} suppressHydrationWarning>
      <body>
        <Notebook>{children}</Notebook>
      </body>
    </html>
  )
}
