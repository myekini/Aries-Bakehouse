import { DM_Sans, Cormorant_Garamond } from 'next/font/google';
import '../index.css';
import Providers from './providers.jsx';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic', 'normal'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL('https://aries11bakehouse.com'),
  applicationName: 'Aries 11 Bakehouse',
  title: 'Aries 11 Bakehouse',
  description: 'Fresh banana bread, brownies, pastries, cake treats and small-chops platters made to order in Abeokuta.',
  icons: {
    icon: '/uploads/Aries11_Monogram_Transparent.svg',
    apple: '/pwa-icon-192.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Aries 11',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Aries 11 Bakehouse',
    description: 'Freshly made treats in Abeokuta, beautifully packed for every occasion.',
    images: ['/uploads/Aries11_Social_Avatar.png'],
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2B140F' },
    { media: '(prefers-color-scheme: dark)', color: '#1C0D0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${cormorantGaramond.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
