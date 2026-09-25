import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Shantell_Sans } from 'next/font/google'
import Notebook from '@/components/Notebook'
import '@/styles/base.css'
import '@/styles/notebook.css'
import '@/styles/objects.css'
import '@/styles/page.css'

// a marker hand with an informality axis, set halfway between a clean sans and handwriting
const hand = Shantell_Sans({ subsets: ['latin'], axes: ['INFM'], variable: '--font-hand' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://eleow.com'),
  title: 'Elliott Leow',
  description: 'Elliott Leow. Biomedical engineering and computer science at Johns Hopkins.',
  icons: { icon: '/favicon.png' },
  openGraph: { title: 'Elliott Leow', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#f3eee1', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hand.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        <Notebook>{children}</Notebook>
      </body>
    </html>
  )
}
