'use client';

import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import { ThemeProvider } from '../context/ThemeContext.jsx';
import Layout from '../components/Layout.jsx';
import SmoothScroll from '../components/SmoothScroll.jsx';
import { Toaster } from '../components/ui/toast.jsx';
import PWAProvider from '../components/PWAProvider.jsx';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <SmoothScroll />
          <Layout>{children}</Layout>
          <PWAProvider />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
