export default function manifest() {
  return {
    id: '/',
    name: 'Aries 11 Bakehouse',
    short_name: 'Aries 11',
    description: 'Made-to-order banana bread, brownies, pastries, cake treats and small chops in Abeokuta.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F5EBD6',
    theme_color: '#2B140F',
    categories: ['food', 'shopping'],
    icons: [
      { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/pwa-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Browse menu', short_name: 'Menu', url: '/menu', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
      { name: 'Search products', short_name: 'Search', url: '/search', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
      { name: 'My account', short_name: 'Account', url: '/account', icons: [{ src: '/pwa-icon-192.png', sizes: '192x192' }] },
    ],
  };
}
