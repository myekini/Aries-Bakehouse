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
  title: 'Aries 11 Bakehouse',
  description: 'Fresh banana bread, brownies, pastries, cake treats and small-chops platters made to order in Abeokuta.',
  icons: {
    icon: '/uploads/Aries11_Monogram_Transparent.svg',
    apple: '/uploads/Aries11_Social_Avatar.png',
  },
  openGraph: {
    title: 'Aries 11 Bakehouse',
    description: 'Freshly made treats in Abeokuta, beautifully packed for every occasion.',
    images: ['/uploads/Aries11_Social_Avatar.png'],
  },
};

export const viewport = {
  themeColor: '#2B140F',
  width: 'device-width',
  initialScale: 1,
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
