'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe, useLogout, useTenants } from '@jastip/api-client';
import { cn } from '@jastip/ui';
import {
  LayoutDashboard,
  Users,
  Store,
  Settings,
  Menu,
  ShoppingCart,
  BarChart2,
  LogOut,
  ChevronRight,
  Building2,
  CreditCard,
  FileText,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Toko', href: '/dashboard/tenants', icon: Building2, roles: ['SUPER_ADMIN'] },
  { name: 'Global Rules', href: '/dashboard/global-rules', icon: CreditCard, roles: ['SUPER_ADMIN'] },
  { name: 'Menu', href: '/dashboard/menu', icon: Menu, roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
  { name: 'Rules', href: '/dashboard/rules', icon: CreditCard, roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, roles: ['ADMIN_TENANT', 'SUPER_ADMIN', 'STAFF'] },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart2, roles: ['ADMIN_TENANT', 'SUPER_ADMIN', 'STAFF'] },
  { name: 'Pengaturan', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN_TENANT', 'SUPER_ADMIN'] },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();
  const { mutate: logout } = useLogout();
  const { data: tenants } = useTenants();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && (!user || error)) {
      // Clear any stale tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('tenant_slug');
      }
      router.push('/login');
      router.refresh();
    }
  }, [user, isLoading, error, router]);

  const userRole = user?.role || 'STAFF';
  const userTenant = user?.tenantSlug;
  const filteredNav = navigation.filter((item) => !item.roles || item.roles.includes(userRole));

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If no user after loading, show loading (redirect will happen via useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-5 border-b">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">Jastip Admin</span>
          </div>

          {/* Tenant Switcher (Super Admin only) */}
          {userRole === 'SUPER_ADMIN' && tenants?.data && (
            <div className="px-4 py-3 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Toko</label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                value={userTenant || ''}
                onChange={(e) => {
                  localStorage.setItem('tenant_slug', e.target.value);
                  window.location.reload();
                }}
              >
                <option value="">-- Pilih Toko --</option>
                {tenants.data.map((t: any) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="p-4 border-t">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate font-medium">{user?.name}</p>
                  <p className="truncate text-xs text-gray-500 capitalize">{userRole.toLowerCase().replace('_', ' ')}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-md shadow-lg border py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
              aria-label="Buka menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {filteredNav.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.name || 'Dashboard'}
              </h1>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}