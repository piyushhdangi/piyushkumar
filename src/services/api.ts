import type {
  UserRecord,
  ItemRecord,
  ClaimRecord,
  StatusHistoryRecord,
  ItemFilterCriteria,
  UserRole,
  ItemStatus,
  ClaimStatus,
} from '../utils/campusLogic';

let memorySessionToken: string | null = null;

export function setClientSessionToken(token: string | null) {
  memorySessionToken = token;
}

export function getClientSessionToken(): string | null {
  return memorySessionToken;
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (memorySessionToken) {
    headers['Authorization'] = `Bearer ${memorySessionToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data as T;
}

export interface OverviewStatsResponse {
  campusStats: {
    totalReports: number;
    totalLost: number;
    totalFound: number;
    totalReturned: number;
    totalMatched: number;
    activeOpen: number;
    activeClaims: number;
    recoveryRate: number;
  };
  userStats: {
    myLostCount: number;
    myFoundCount: number;
    myActiveClaims: number;
    myReturnedCount: number;
    incomingPendingClaims: number;
  } | null;
  recentHistory: StatusHistoryRecord[];
}

export interface AdminDashboardResponse {
  metrics: {
    totalUsers: number;
    totalStudents: number;
    totalStaff: number;
    totalAdmins: number;
    totalItems: number;
    totalLost: number;
    totalFound: number;
    openItems: number;
    matchedItems: number;
    returnedItems: number;
    closedItems: number;
    pendingClaims: number;
    approvedClaims: number;
    rejectedClaims: number;
    flaggedDuplicates: number;
  };
  recentReports: ItemRecord[];
  claims: ClaimRecord[];
  statusHistory: StatusHistoryRecord[];
  duplicateAlerts: Array<{ item: ItemRecord; matches: ItemRecord[] }>;
  settings: { requireEduDomain: boolean };
}

export const api = {
  // Authentication
  getMe: () =>
    apiFetch<{ user: Omit<UserRecord, 'password_hash'> | null; settings: { requireEduDomain: boolean } }>(
      '/api/auth/me'
    ),

  login: async (email: string, password: string, portalRole?: 'student' | 'admin') => {
    const res = await apiFetch<{
      message: string;
      user: Omit<UserRecord, 'password_hash'>;
      token: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, portalRole }),
    });
    setClientSessionToken(res.token);
    return res;
  },

  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'staff';
    department?: string;
    student_or_staff_id?: string;
  }) => {
    const res = await apiFetch<{
      message: string;
      user: Omit<UserRecord, 'password_hash'>;
      token: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setClientSessionToken(res.token);
    return res;
  },

  logout: async () => {
    await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' });
    setClientSessionToken(null);
  },

  // Overview & Items
  getOverviewStats: () => apiFetch<OverviewStatsResponse>('/api/stats/overview'),

  getItems: (filters: ItemFilterCriteria = {}) => {
    const params = new URLSearchParams();
    if (filters.keyword) params.set('keyword', filters.keyword);
    if (filters.category && filters.category !== 'All') params.set('category', filters.category);
    if (filters.location) params.set('location', filters.location);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.itemType && filters.itemType !== 'All') params.set('itemType', filters.itemType);
    if (filters.status && filters.status !== 'All') params.set('status', filters.status);
    const qs = params.toString();
    return apiFetch<{ items: ItemRecord[] }>(`/api/items${qs ? `?${qs}` : ''}`);
  },

  getItemDetail: (itemId: number) =>
    apiFetch<{
      item: ItemRecord;
      statusHistory: StatusHistoryRecord[];
      claims: ClaimRecord[];
    }>(`/api/items/${itemId}`),

  createItem: (payload: {
    title: string;
    description: string;
    category: string;
    item_type: 'Lost' | 'Found';
    location: string;
    report_date: string;
    image_data?: string | null;
    identifying_details?: string;
    verification_question?: string;
  }) =>
    apiFetch<{ message: string; item: ItemRecord }>('/api/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateItem: (
    itemId: number,
    payload: Partial<{
      title: string;
      description: string;
      category: string;
      item_type: 'Lost' | 'Found';
      location: string;
      report_date: string;
      image_data: string | null;
      identifying_details: string;
      verification_question: string;
      status: ItemStatus;
    }>
  ) =>
    apiFetch<{ message: string; item: ItemRecord }>(`/api/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteItem: (itemId: number) =>
    apiFetch<{ message: string }>(`/api/items/${itemId}`, {
      method: 'DELETE',
    }),

  // Claims
  createClaim: (payload: {
    item_id: number;
    identifying_features: string;
    verification_note: string;
  }) =>
    apiFetch<{ message: string; claim: ClaimRecord }>('/api/claims', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyClaims: () =>
    apiFetch<{
      submittedClaims: ClaimRecord[];
      receivedClaims: ClaimRecord[];
    }>('/api/claims/my'),

  getClaimsForItem: (itemId: number) =>
    apiFetch<{ claims: ClaimRecord[] }>(`/api/claims/item/${itemId}`),

  updateClaimStatus: (
    claimId: number,
    payload: {
      status: ClaimStatus;
      reviewer_note?: string;
      mark_item_returned?: boolean;
    }
  ) =>
    apiFetch<{ message: string; claim: ClaimRecord }>(`/api/claims/${claimId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // Admin
  getAdminDashboard: () => apiFetch<AdminDashboardResponse>('/api/admin/dashboard'),

  getAdminUsers: () =>
    apiFetch<{
      users: Array<
        Omit<UserRecord, 'password_hash'> & { reports_count: number; claims_count: number }
      >;
    }>('/api/admin/users'),

  updateUserRole: (userId: number, role: UserRole) =>
    apiFetch<{ message: string; user: Omit<UserRecord, 'password_hash'> }>(
      `/api/admin/users/${userId}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }
    ),

  getAdminReports: () => apiFetch<{ reports: ItemRecord[] }>('/api/admin/reports'),

  adminUpdateItemStatus: (
    itemId: number,
    payload: {
      status?: ItemStatus;
      note?: string;
      is_flagged_duplicate?: boolean;
    }
  ) =>
    apiFetch<{ message: string; item: ItemRecord }>(`/api/admin/items/${itemId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateAdminSettings: (requireEduDomain: boolean) =>
    apiFetch<{ message: string; settings: { requireEduDomain: boolean } }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ requireEduDomain }),
    }),

  resetDemoData: () =>
    apiFetch<{ message: string }>('/api/admin/reset-demo', {
      method: 'POST',
    }),
};
