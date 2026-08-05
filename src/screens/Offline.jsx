'use client';

import { RefreshCw, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Offline() {
  return (
    <main className="offline-page">
      <span className="offline-page__icon" aria-hidden="true"><WifiOff size={26} /></span>
      <p className="page-kicker">Connection paused</p>
      <h1>You are offline</h1>
      <p>Previously viewed public pages may still work. Ordering, payment, and account changes need an internet connection.</p>
      <div className="offline-page__actions">
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          <RefreshCw size={16} aria-hidden="true" /> Try again
        </button>
        <Link to="/menu" className="btn btn-secondary">View saved menu</Link>
      </div>
    </main>
  );
}
