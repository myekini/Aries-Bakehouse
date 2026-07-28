'use client';

import { AuthProvider } from '../context/AuthContext.jsx';
import { CartProvider } from '../context/CartContext.jsx';
import Layout from '../components/Layout.jsx';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>{children}</Layout>
      </CartProvider>
    </AuthProvider>
  );
}
