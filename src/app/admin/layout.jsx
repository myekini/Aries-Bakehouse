'use client';

import RequireAdmin from '../../admin/RequireAdmin.jsx';
import AdminLayout from '../../admin/AdminLayout.jsx';

export default function AdminRouteLayout({ children }) {
  return (
    <RequireAdmin>
      <AdminLayout>{children}</AdminLayout>
    </RequireAdmin>
  );
}
