'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useMe,
  useTenants,
  useSalesAnalytics,
  useTopItemsAnalytics,
  useRevenueByRestaurant,
  useOrders,
} from '@jastip/api-client';
import {
  Button,
  Badge,
  Avatar,
  Card,
  CardContent,
  formatCurrency,
  formatDate,
} from '@jastip/ui';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  ShoppingCart,
  DollarSign,
  Menu,
  Package,
  BarChart3,
  Settings,
  Store,
  Plus,
  RefreshCw,
  ChevronRight,
  User as UserIcon,
  Shield,
  Lock,
} from 'lucide-react';

const TREND_DATA = {
  totalTenants: { label: 'bulan lalu', value: '+12%', up: true },
  totalUsers: { label: 'bulan lalu', value: '+8%', up: true },
  totalOrders: { label: 'bulan lalu', value: '+23%', up: true },
  totalRevenue: { label: 'bulan lalu', value: '+18%', up: true },
};

const QUICK_ACTIONS = [
  {
    icon: Building2,
    label: 'Kelola Toko',
    href: '/dashboard/tenants',
    show: (role: string) => role === 'SUPER_ADMIN',
  },
  {
    icon: Menu,
    label: 'Kelola Menu',
    href: '/dashboard/menu',
    show: () => true,
  },
  {
    icon: Package,
    label: 'Pesanan',
    href: '/dashboard/orders',
    show: () => true,
  },
  {
    icon: BarChart3,
    label: 'Analitik',
    href: '/dashboard/analytics',
    show: () => true,
  },
  {
    icon: Settings,
    label: 'Pengaturan',
    href: '/dashboard/settings',
    show: () => true,
  },
];

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'Lunas';
    case 'COMPLETED':
    case 'DELIVERED':
      return 'Selesai';
    case 'PENDING':
      return 'Menunggu';
    case 'PROCESSING':
      return 'Proses';
    case 'CANCELLED':
      return 'Batal';
    default:
      return status;
  }
}

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
    case 'DELIVERED':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'PROCESSING':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

function RoleBadge({ role }: { role: string }) {
  const variants: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
    ADMIN_TENANT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    STAFF: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  };
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN_TENANT: 'Admin Toko',
    STAFF: 'Staff',
  };
  return (
    <Badge variant="outline" className={variants[role] || variants.STAFF + ' text-xs px-2 py-1'}>
      {labels[role] || role}
    </Badge>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useMe();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const userRole = user?.role || 'STAFF';
  const userTenant = user?.tenantSlug;

  const { data: tenants } = useTenants(undefined, {
    enabled: isSuperAdmin && !!user,
  });
  const { data: sales } = useSalesAnalytics({ period: 'daily' }, {
    enabled: !!user,
  });
  const { data: topItems } = useTopItemsAnalytics({ limit: 5 }, {
    enabled: !!user,
  });
  const { data: revenueByRestaurant } = useRevenueByRestaurant(undefined, {
    enabled: isSuperAdmin && !!user,
  });
  const { data: orders } = useOrders({ limit: 5 }, { enabled: !!user });

  const salesData = sales as { period: string; data: any[]; summary: any } | undefined;
  const topItemsData = topItems as { menuItemId: string; name: string; category: string; quantity: number; orderCount: number; revenue: number }[] | undefined;
  const revenueData = revenueByRestaurant as { restaurantId: string; restaurantName: string; orders: number; total: number }[] | undefined;

  const stats = {
    totalTenants: tenants?.meta?.total || 0,
    totalUsers: 0,
    totalOrders: salesData?.summary?.totalOrders || 0,
    totalRevenue: salesData?.summary?.totalRevenue || 0,
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      router.refresh();
    }, 600);
  }, [router]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  const filteredActions = QUICK_ACTIONS.filter((a) => a.show(userRole));
  const recentOrders = orders?.data || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <div className="flex items-center gap-2">
                <RoleBadge role={userRole} />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  • {isSuperAdmin ? 'Kelola semua toko' : userTenant || 'Toko Anda'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-lg"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Link href="/dashboard/menu">
              <Button size="sm" className="rounded-lg bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
              </Button>
            </Link>
            <Avatar
              src={user.image || undefined}
              alt={user.name}
              size="sm"
              fallback={<span className="text-gray-700 dark:text-white">{getInitials(user.name)}</span>}
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        {/* Super Admin: Role Info */}
        {isSuperAdmin && (
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 border border-purple-100 dark:border-purple-800 mb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                Mode Super Admin — Anda memiliki akses penuh ke semua toko dan data
              </span>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Tenants - Hanya Super Admin */}
          {isSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Total Toko</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalTenants}</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                {TREND_DATA.totalTenants.value} <span className="text-gray-400">dari {TREND_DATA.totalTenants.label}</span>
              </p>
            </motion.div>
          )}

          {/* Total Pesanan */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Pesanan</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalOrders}</p>
            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
              {TREND_DATA.totalOrders.value} <span className="text-gray-400">dari {TREND_DATA.totalOrders.label}</span>
            </p>
          </motion.div>

          {/* Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Revenue</span>
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.totalRevenue)}
            </p>
            <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
              {TREND_DATA.totalRevenue.value} <span className="text-gray-400">dari {TREND_DATA.totalRevenue.label}</span>
            </p>
          </motion.div>

          {/* Pengguna - Hanya Super Admin */}
          {isSuperAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">Pengguna</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1">
                {TREND_DATA.totalUsers.value} <span className="text-gray-400">dari {TREND_DATA.totalUsers.label}</span>
              </p>
            </motion.div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
            {isSuperAdmin ? 'Menu Admin' : 'Menu Cepat'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {filteredActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <action.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white text-center">
                    {action.label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Pesanan Terbaru</h2>
            <Link href="/dashboard/orders">
              <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                Lihat semua <ChevronRight className="h-3 w-3" />
              </button>
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any) => (
                <div key={order.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.orderNumber || order.id.slice(-8)} • {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(order.grandTotal || 0)}
                    </p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Belum ada pesanan
              </div>
            )}
          </div>
        </div>

        {/* Top Selling */}
        {topItemsData && topItemsData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Menu Terlaris</h2>
              <Link href="/dashboard/menu">
                <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  Lihat semua <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {topItemsData.map((item, index) => (
                <div key={item.menuItemId} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.orderCount} terjual
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Revenue per Store - Hanya Super Admin */}
        {isSuperAdmin && revenueData && revenueData.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Revenue per Toko</h2>
              <Link href="/dashboard/tenants">
                <button className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                  Lihat semua <ChevronRight className="h-3 w-3" />
                </button>
              </Link>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {revenueData.slice(0, 3).map((r) => (
                <div key={r.restaurantId} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                      <Store className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {r.restaurantName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {r.orders} pesanan
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(r.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
