'use client';

import { useLocation } from 'react-router-dom';
import { Button } from './ui/button.jsx';

export default function FloatingSupport() {
  const { pathname } = useLocation();
  if (pathname === '/contact') return null;

  return (
    <Button asChild variant="whatsapp" className="floating-support">
      <a
        href="https://wa.me/2348121145785"
        target="_blank"
        rel="noreferrer"
        aria-label="Open WhatsApp support"
      >
        <WhatsAppIcon />
        <span>Support</span>
      </a>
    </Button>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2Zm0 18c-1.5 0-3-.4-4.3-1.1l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8Z" />
    </svg>
  );
}
