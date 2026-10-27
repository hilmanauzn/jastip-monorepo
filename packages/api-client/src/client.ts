import type { ApiResponse, PaginatedResponse } from '@jastip/shared-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok) {
    const errorData = isJson ? await response.json() : await response.text();
    throw new ApiError(
      isJson && typeof errorData === 'object' && errorData !== null && 'error' in errorData
        ? (errorData as { error: string }).error
        : `HTTP error ${response.status}`,
      response.status,
      errorData
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return isJson ? response.json() : response.text() as Promise<T>;
}

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get token from localStorage (client-side only)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add tenant header if available
    const tenantSlug = localStorage.getItem('tenant_slug');
    if (tenantSlug) {
      headers['x-tenant-slug'] = tenantSlug;
    }
  }

  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });
  return handleResponse<T>(response);
}

// Auth endpoints
// NOTE: Backend wraps all responses as { success: true, data: { ... } }
// We unwrap here so hooks receive the raw payload.
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ success: boolean; data: { accessToken: string; refreshToken: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }).then((res: any) => res.data),

  refresh: (refreshToken: string) =>
    apiRequest<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => apiRequest<any>('/auth/me'),

  logout: () => apiRequest<void>('/auth/logout', { method: 'POST' }),
};

// Tenant endpoints (Super Admin)
export const tenantApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/tenants?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  get: (id: string) => apiRequest<any>(`/api/tenants/${id}`),

  create: (data: any) =>
    apiRequest<any>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/api/tenants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/tenants/${id}`, { method: 'DELETE' }),

  stats: (id: string) => apiRequest<any>(`/api/tenants/${id}/stats`),
};

// User endpoints (Admin Tenant)
export const userApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/users?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  get: (id: string) => apiRequest<any>(`/api/users/${id}`),

  create: (data: any) =>
    apiRequest<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/users/${id}`, { method: 'DELETE' }),
};

// Restaurant endpoints
export const restaurantApi = {
  list: (params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/restaurants?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  get: (id: string) => apiRequest<any>(`/api/restaurants/${id}`),

  create: (data: any) =>
    apiRequest<any>('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/api/restaurants/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/restaurants/${id}`, { method: 'DELETE' }),

  setJastipOverride: (id: string, fee: number, createdBy?: string) =>
    apiRequest<any>(`/api/restaurants/${id}/jastip-override`, {
      method: 'POST',
      body: JSON.stringify({ fee, createdBy }),
    }),

  removeJastipOverride: (id: string) =>
    apiRequest<void>(`/api/restaurants/${id}/jastip-override`, { method: 'DELETE' }),
};

// Menu endpoints
export const menuApi = {
  list: (params?: { page?: number; limit?: number; search?: string; category?: string; restaurantId?: string; isAvailable?: boolean }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/menu?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  categories: (restaurantId?: string) =>
    apiRequest<any[]>(`/api/menu/categories${restaurantId ? `?restaurantId=${restaurantId}` : ''}`),

  get: (id: string) => apiRequest<any>(`/api/menu/${id}`),

  create: (data: any) =>
    apiRequest<any>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/api/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/menu/${id}`, { method: 'DELETE' }),

  bulk: (items: any[]) =>
    apiRequest<any>('/api/menu/bulk', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

// Order endpoints
export const orderApi = {
  list: (params?: { page?: number; limit?: number; status?: string; customerId?: string; dateFrom?: string; dateTo?: string }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/orders?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  get: (id: string) => apiRequest<any>(`/api/orders/${id}`),

  preview: (data: any) =>
    apiRequest<any>('/api/orders/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  create: (data: any) =>
    apiRequest<any>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string) =>
    apiRequest<any>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  updatePayment: (id: string, paymentStatus: string) =>
    apiRequest<any>(`/api/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/orders/${id}`, { method: 'DELETE' }),
};

// Customer endpoints
export const customerApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    apiRequest<PaginatedResponse<any>>(
      `/api/customers?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  get: (id: string) => apiRequest<any>(`/api/customers/${id}`),

  create: (data: any) =>
    apiRequest<any>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    apiRequest<any>(`/api/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/api/customers/${id}`, { method: 'DELETE' }),
};

// Jastip Rules endpoints
export const jastipRuleApi = {
  getGlobal: () => apiRequest<any>('/api/jastip-rules/global'),

  updateGlobal: (data: any) =>
    apiRequest<any>('/api/jastip-rules/global', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getTenant: () => apiRequest<any>('/api/jastip-rules/tenant'),

  updateTenant: (data: any) =>
    apiRequest<any>('/api/jastip-rules/tenant', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Settings endpoints
export const settingsApi = {
  get: () => apiRequest<any>('/api/settings'),

  update: (data: any) =>
    apiRequest<any>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Analytics endpoints
export const analyticsApi = {
  sales: (params?: { period?: 'daily' | 'weekly' | 'monthly'; dateFrom?: string; dateTo?: string }) =>
    apiRequest<any>(
      `/api/analytics/sales?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  topItems: (params?: { limit?: number; dateFrom?: string; dateTo?: string }) =>
    apiRequest<any[]>(
      `/api/analytics/top-items?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  byCategory: (params?: { dateFrom?: string; dateTo?: string }) =>
    apiRequest<any[]>(
      `/api/analytics/by-category?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),

  revenueByRestaurant: (params?: { dateFrom?: string; dateTo?: string }) =>
    apiRequest<any[]>(
      `/api/analytics/revenue-by-restaurant?${new URLSearchParams(params as Record<string, string>).toString()}`
    ),
};