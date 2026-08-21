import api from '@/lib/axios';

const createFormDataPayload = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== undefined && data[key] !== null) {
      if (key === 'items' && (Array.isArray(data[key]) || typeof data[key] === 'object')) {
        formData.append(key, JSON.stringify(data[key]));
      } else if (data[key] instanceof File) {
        formData.append('image', data[key]);
      } else {
        formData.append(key, data[key]);
      }
    }
  });
  return formData;
};

// Business API
export const businessApi = {
  getProfile: async () => {
    const res = await api.get('/business');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.patch('/business', data);
    return res.data;
  },
  getKnowledge: async () => {
    const res = await api.get('/business/knowledge');
    return res.data;
  },
  updateKnowledge: async (data) => {
    const res = await api.put('/business/knowledge', data);
    return res.data;
  },
  getHours: async () => {
    const res = await api.get('/business/hours');
    return res.data;
  },
  updateHours: async (data) => {
    const res = await api.put('/business/hours', data);
    return res.data;
  },
  getOnboardingStatus: async () => {
    const res = await api.get('/business/onboarding-status');
    return res.data;
  },
  completeOnboarding: async () => {
    const res = await api.post('/business/complete-onboarding');
    return res.data;
  },
};

// Categories API
export const categoriesApi = {
  getAll: async (params) => {
    const res = await api.get('/categories', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/categories/stats');
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  update: async ({ id, ...data }) => {
    const res = await api.patch(`/categories/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

// Menu API
export const menuApi = {
  getAll: async (params) => {
    const res = await api.get('/menu', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/menu/stats');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/menu/${id}`);
    return res.data;
  },
  create: async (data) => {
    const payload = data.file instanceof File || data.image instanceof File
      ? createFormDataPayload(data)
      : data;
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.post('/menu', payload, config);
    return res.data;
  },
  update: async ({ id, ...data }) => {
    const payload = data.file instanceof File || data.image instanceof File
      ? createFormDataPayload(data)
      : data;
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.patch(`/menu/${id}`, payload, config);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/menu/${id}`);
    return res.data;
  },
};

// Deals API
export const dealsApi = {
  getAll: async (params) => {
    const res = await api.get('/deals', { params });
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/deals/stats');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/deals/${id}`);
    return res.data;
  },
  create: async (data) => {
    const payload = data.file instanceof File || data.image instanceof File
      ? createFormDataPayload(data)
      : data;
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.post('/deals', payload, config);
    return res.data;
  },
  update: async ({ id, ...data }) => {
    const payload = data.file instanceof File || data.image instanceof File
      ? createFormDataPayload(data)
      : data;
    const config = payload instanceof FormData
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const res = await api.patch(`/deals/${id}`, payload, config);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/deals/${id}`);
    return res.data;
  },
};

// Customers API
export const customersApi = {
  getStats: async () => {
    const res = await api.get('/customers/stats');
    return res.data;
  },
  getAll: async (params) => {
    const res = await api.get('/customers', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return res.data;
  },
};

// Orders API
export const ordersApi = {
  getAll: async (params) => {
    const res = await api.get('/orders', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return res.data;
  },
  updateStatus: async ({ id, status }) => {
    const res = await api.patch(`/orders/${id}/status`, { status });
    return res.data;
  },
};

// Conversations API
export const conversationsApi = {
  getStats: async (dateRange = 'all') => {
    const res = await api.get('/conversations/stats', { params: { dateRange } });
    return res.data;
  },
  getAll: async (params) => {
    const res = await api.get('/conversations', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/conversations/${id}`);
    return res.data;
  },
  updateStatus: async ({ id, status }) => {
    const res = await api.patch(`/conversations/${id}/status`, { status });
    return res.data;
  },
};

// Telegram API
export const telegramApi = {
  getConfig: async () => {
    const res = await api.get('/telegram');
    return res.data;
  },
  connectBot: async (data) => {
    const res = await api.post('/telegram/connect', data);
    return res.data;
  },
  disconnectBot: async () => {
    const res = await api.post('/telegram/disconnect');
    return res.data;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get('/dashboard/stats');
    return res.data;
  },
};

// Analytics API
export const analyticsApi = {
  getBusinessAnalytics: async (timeRange = 'weekly') => {
    const res = await api.get('/analytics/business', { params: { timeRange } });
    return res.data;
  },
  getAiAnalytics: async (timeRange = 'weekly') => {
    const res = await api.get('/analytics/ai', { params: { timeRange } });
    return res.data;
  },
};

