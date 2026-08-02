'use client';

import { useTheme } from '../context/ThemeContext.jsx';

export default function BrandLogo({ className = '', tone = 'adaptive' }) {
  const { theme } = useTheme();
  const useLightArtwork = tone === 'light' || (tone === 'adaptive' && theme === 'dark');

  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src={useLightArtwork
        ? '/uploads/Aries11_Primary_Dark.svg'
        : '/uploads/Aries11_Primary_Transparent.svg'}
      alt="Aries 11 Bakehouse"
    />
  );
}
