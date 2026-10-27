import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import {
  authApi,
  tenantApi,
  userApi,
  restaurantApi,
  menuApi,
  orderApi,
  customerApi,
  jastipRuleApi,
  settingsApi,
  analyticsApi,
} from '../client';
import type { PaginatedResponse } from '@jastip/shared-types';

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const login = (
    variables: { email: string; password: string },
    options?: {
      onSuccess?: (data: any) => void;
      onError?: (err: any) => void;
    }
  ) => {
    mutation.mutate(variables, {
      ...options,
      onSuccess: (data: any) => {
        // Always save token to localStorage + cookies (runs BEFORE caller's onSuccess)
        // Backend wraps response as { success: true, data: { ... } } but authApi.login unwraps it.
        // Be defensive: handle both wrapped and unwrapped shapes.
        const payload = data?.data?.accessToken ? data.data : data;
        if (typeof window !== 'undefined' && payload?.accessToken) {
          localStorage.setItem('access_token', payload.accessToken);
          localStorage.setItem('refresh_token', payload.refreshToken);
          localStorage.setItem('user', JSON.stringify(payload.user));
          const cookieOptions = 'path=/; max-age=604800; SameSite=Lax';
          document.cookie = `access_token=${payload.accessToken}; ${cookieOptions}`;
          document.cookie = `refresh_token=${payload.refreshToken}; ${cookieOptions}`;
        }
        options?.onSuccess?.(data);
      },
      onError: options?.onError,
    });
  };

  return {
    ...mutation,
    mutate: login,
    login,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant_slug');
        
        // Clear cookies
        document.cookie = 'access_token=; path=/; max-age=0';
        document.cookie = 'refresh_token=; path=/; max-age=0';
      }
      queryClient.clear();
    },
  });
}

export function useMe(options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// Tenant hooks (Super Admin)
export function useTenants(params?: { page?: number; limit?: number; search?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['tenants', params],
    queryFn: () => tenantApi.list(params),
    ...options,
  });
}

export function useTenant(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => tenantApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tenantApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

// User hooks (Admin Tenant)
export function useUsers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.list(params),
  });
}

export function useUser(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Restaurant hooks
export function useRestaurants(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['restaurants', params],
    queryFn: () => restaurantApi.list(params),
    ...options,
  });
}

export function useRestaurant(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => restaurantApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restaurantApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useUpdateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => restaurantApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
    },
  });
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restaurantApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useSetJastipOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fee, createdBy }: { id: string; fee: number; createdBy?: string }) =>
      restaurantApi.setJastipOverride(id, fee, createdBy),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

export function useRemoveJastipOverride() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: restaurantApi.removeJastipOverride,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['restaurant', id] });
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}

// Menu hooks
export function useMenus(params?: { page?: number; limit?: number; search?: string; category?: string; restaurantId?: string; isAvailable?: boolean }) {
  return useQuery({
    queryKey: ['menus', params],
    queryFn: () => menuApi.list(params),
  });
}

export function useMenuCategories(restaurantId?: string) {
  return useQuery({
    queryKey: ['menu-categories', restaurantId],
    queryFn: () => menuApi.categories(restaurantId),
  });
}

export function useMenu(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useUpdateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      queryClient.invalidateQueries({ queryKey: ['menu', id] });
    },
  });
}

export function useDeleteMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

export function useBulkCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.bulk,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    },
  });
}

// Order hooks
export function useOrders(params?: { page?: number; limit?: number; status?: string; customerId?: string; dateFrom?: string; dateTo?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => orderApi.list(params),
    ...options,
  });
}

export function useOrder(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function usePreviewOrder() {
  return useMutation({
    mutationFn: orderApi.preview,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => orderApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useUpdateOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paymentStatus }: { id: string; paymentStatus: string }) => orderApi.updatePayment(id, paymentStatus),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Customer hooks
export function useCustomers(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customerApi.list(params),
  });
}

export function useCustomer(id: string, options?: UseQueryOptions<any>) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerApi.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => customerApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

// Jastip Rules hooks
export function useGlobalJastipRule() {
  return useQuery({
    queryKey: ['jastip-rule', 'global'],
    queryFn: jastipRuleApi.getGlobal,
  });
}

export function useUpdateGlobalJastipRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jastipRuleApi.updateGlobal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jastip-rule', 'global'] });
    },
  });
}

export function useTenantJastipRule() {
  return useQuery({
    queryKey: ['jastip-rule', 'tenant'],
    queryFn: jastipRuleApi.getTenant,
  });
}

export function useUpdateTenantJastipRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: jastipRuleApi.updateTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jastip-rule', 'tenant'] });
    },
  });
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Analytics hooks
export function useSalesAnalytics(params?: { period?: 'daily' | 'weekly' | 'monthly'; dateFrom?: string; dateTo?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['analytics', 'sales', params],
    queryFn: () => analyticsApi.sales(params),
    ...options,
  });
}

export function useTopItemsAnalytics(params?: { limit?: number; dateFrom?: string; dateTo?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['analytics', 'top-items', params],
    queryFn: () => analyticsApi.topItems(params),
    ...options,
  });
}

export function useCategoryAnalytics(params?: { dateFrom?: string; dateTo?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['analytics', 'by-category', params],
    queryFn: () => analyticsApi.byCategory(params),
    ...options,
  });
}

export function useRevenueByRestaurant(params?: { dateFrom?: string; dateTo?: string }, options?: Partial<UseQueryOptions<any>>) {
  return useQuery({
    queryKey: ['analytics', 'revenue-by-restaurant', params],
    queryFn: () => analyticsApi.revenueByRestaurant(params),
    ...options,
  });
}