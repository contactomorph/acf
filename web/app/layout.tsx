import { NextFont } from 'next/dist/compiled/@next/font'
import { Inter } from 'next/font/google'
import './globals.css'

const inter: NextFont = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Allures Athlétic Cœur de fond',
  description: 'Les entraînements d\'ACF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <header>
          <img className='header-content' src='./icon.svg' />
          <div className='header-content'>Allures Athlétic Cœur de fond</div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
