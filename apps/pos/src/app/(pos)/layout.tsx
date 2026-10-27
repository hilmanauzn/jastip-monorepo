'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMe } from '@jastip/api-client';
import { Providers } from '@/components/Providers';

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: user, isLoading, error } = useMe();

  // Resolve tenant from subdomain on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Extract tenant slug from subdomain: toko-a.jastip.com → toko-a
      // Or from localhost: toko-a.localhost:3000 → toko-a
      let tenantSlug = hostname.split('.')[0];
      
      // Handle localhost development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Default to toko-a for local dev, or read from localStorage
        tenantSlug = localStorage.getItem('tenant_slug') || 'toko-a';
      }
      
      localStorage.setItem('tenant_slug', tenantSlug);
      
      // Also set cookie for middleware
      document.cookie = `tenant_slug=${tenantSlug}; path=/; max-age=604800; SameSite=Lax`;
    }
  }, []);

  // Auth guard - redirect to login if not authenticated or wrong role
  useEffect(() => {
    if (!isLoading) {
      if (!user || error) {
        // Clear stale tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
        router.push('/login');
        router.refresh();
        return;
      }
      
      // Role check: only STAFF and ADMIN_TENANT can access POS
      const allowedRoles = ['STAFF', 'ADMIN_TENANT'];
      if (!allowedRoles.includes(user?.role || '')) {
        router.push('/login?error=unauthorized');
        router.refresh();
        return;
      }
      
      // Tenant context check: ensure user's tenant matches subdomain
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const subdomainTenant = hostname.split('.')[0];
        if (user.tenantSlug && subdomainTenant !== 'localhost' && subdomainTenant !== user.tenantSlug) {
          // Mismatch - redirect to correct subdomain
          const correctUrl = window.location.protocol + '//' + user.tenantSlug + '.' + window.location.hostname.split('.').slice(1).join('.');
          window.location.href = correctUrl;
          return;
        }
      }
    }
  }, [user, isLoading, error, router]);

  if (isLoading) {
    return (
      <html lang="id" suppressHydrationWarning>
        <body className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </body>
      </html>
    );
  }

  if (!user || error) {
    return null; // Redirect handled by useEffect
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}