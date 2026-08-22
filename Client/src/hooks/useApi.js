import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  businessApi,
  categoriesApi,
  menuApi,
  dealsApi,
  customersApi,
  ordersApi,
  telegramApi,
  dashboardApi,
  analyticsApi,
  conversationsApi,
} from '@/lib/api/services';

// Query Keys
export const QUERY_KEYS = {
  business: ['business'],
  businessKnowledge: ['business', 'knowledge'],
  businessHours: ['business', 'hours'],
  categories: (params) => ['categories', params],
  menu: (params) => ['menu', params],
  menuItem: (id) => ['menu', id],
  deals: (params) => ['deals', params],
  deal: (id) => ['deals', id],
  customers: (params) => ['customers', params],
  customer: (id) => ['customers', id],
  orders: (params) => ['orders', params],
  order: (id) => ['orders', id],
  conversations: (params) => ['conversations', params],
  conversation: (id) => ['conversations', id],
  conversationStats: (dateRange) => ['conversations', 'stats', dateRange],
  telegram: ['telegram'],
  dashboard: ['dashboard'],
  businessAnalytics: (timeRange) => ['analytics', 'business', timeRange],
  aiAnalytics: (timeRange) => ['analytics', 'ai', timeRange],
};

// ----------------------------------------------------
// Business Hooks
// ----------------------------------------------------
export function useOnboardingStatus(options = {}) {
  return useQuery({
    queryKey: ['onboarding-status'],
    queryFn: businessApi.getOnboardingStatus,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.business });
    },
  });
}

export function useBusinessProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.business,
    queryFn: businessApi.getProfile,
  });
}

export function useUpdateBusinessProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.business });
    },
  });
}

export function useBusinessKnowledge() {
  return useQuery({
    queryKey: QUERY_KEYS.businessKnowledge,
    queryFn: businessApi.getKnowledge,
  });
}

export function useUpdateBusinessKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateKnowledge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessKnowledge });
    },
  });
}

export function useBusinessHours() {
  return useQuery({
    queryKey: QUERY_KEYS.businessHours,
    queryFn: businessApi.getHours,
  });
}

export function useUpdateBusinessHours() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: businessApi.updateHours,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessHours });
    },
  });
}

// ----------------------------------------------------
// Categories Hooks
// ----------------------------------------------------
export function useCategories(params) {
  return useQuery({
    queryKey: QUERY_KEYS.categories(params),
    queryFn: () => categoriesApi.getAll(params),
  });
}

export function useCategoryStats() {
  return useQuery({
    queryKey: ['category-stats'],
    queryFn: categoriesApi.getStats,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category-stats'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
    },
  });
}

// ----------------------------------------------------
// Menu Hooks
// ----------------------------------------------------
export function useMenuItems(params) {
  return useQuery({
    queryKey: QUERY_KEYS.menu(params),
    queryFn: () => menuApi.getAll(params),
  });
}

export function useMenuStats() {
  return useQuery({
    queryKey: ['menu-stats'],
    queryFn: menuApi.getStats,
  });
}

export function useMenuItem(id) {
  return useQuery({
    queryKey: QUERY_KEYS.menuItem(id),
    queryFn: () => menuApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.menuItem(variables.id) });
      }
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: menuApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
      queryClient.invalidateQueries({ queryKey: ['menu-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ----------------------------------------------------
// Deals Hooks
// ----------------------------------------------------
export function useDeals(params) {
  return useQuery({
    queryKey: QUERY_KEYS.deals(params),
    queryFn: () => dealsApi.getAll(params),
  });
}

export function useDealStats() {
  return useQuery({
    queryKey: ['deal-stats'],
    queryFn: dealsApi.getStats,
  });
}

export function useDeal(id) {
  return useQuery({
    queryKey: QUERY_KEYS.deal(id),
    queryFn: () => dealsApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.deal(variables.id) });
      }
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dealsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal-stats'] });
    },
  });
}

// ----------------------------------------------------
// Customers Hooks
// ----------------------------------------------------
export function useCustomerStats() {
  return useQuery({
    queryKey: ['customers-stats'],
    queryFn: customersApi.getStats,
  });
}

export function useCustomers(params) {
  return useQuery({
    queryKey: QUERY_KEYS.customers(params),
    queryFn: () => customersApi.getAll(params),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: QUERY_KEYS.customer(id),
    queryFn: () => customersApi.getById(id),
    enabled: Boolean(id),
  });
}

// ----------------------------------------------------
// Orders Hooks
// ----------------------------------------------------
export function useOrders(params) {
  return useQuery({
    queryKey: QUERY_KEYS.orders(params),
    queryFn: () => ordersApi.getAll(params),
  });
}

export function useOrder(id) {
  return useQuery({
    queryKey: QUERY_KEYS.order(id),
    queryFn: () => ordersApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.updateStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.order(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

// ----------------------------------------------------
// Telegram Hooks
// ----------------------------------------------------
export function useTelegramConfig() {
  return useQuery({
    queryKey: QUERY_KEYS.telegram,
    queryFn: telegramApi.getConfig,
  });
}

export function useConnectTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: telegramApi.connectBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.telegram });
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });
}

export function useDisconnectTelegramBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: telegramApi.disconnectBot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.telegram });
      queryClient.invalidateQueries({ queryKey: ['business'] });
    },
  });
}

// ----------------------------------------------------
// Dashboard Hooks
// ----------------------------------------------------
export function useDashboardStats() {
  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: dashboardApi.getStats,
  });
}

// ----------------------------------------------------
// Analytics Hooks
// ----------------------------------------------------
export function useBusinessAnalytics(timeRange = 'weekly') {
  return useQuery({
    queryKey: QUERY_KEYS.businessAnalytics(timeRange),
    queryFn: () => analyticsApi.getBusinessAnalytics(timeRange),
  });
}

export function useAiAnalytics(timeRange = 'weekly') {
  return useQuery({
    queryKey: QUERY_KEYS.aiAnalytics(timeRange),
    queryFn: () => analyticsApi.getAiAnalytics(timeRange),
    refetchInterval: 5000,
  });
}

// ----------------------------------------------------
// Conversations Hooks
// ----------------------------------------------------
export function useConversationStats(dateRange = 'all') {
  return useQuery({
    queryKey: QUERY_KEYS.conversationStats(dateRange),
    queryFn: () => conversationsApi.getStats(dateRange),
    refetchInterval: 5000,
  });
}

export function useConversations(params) {
  return useQuery({
    queryKey: QUERY_KEYS.conversations(params),
    queryFn: () => conversationsApi.getAll(params),
    refetchInterval: 5000,
  });
}

export function useConversation(id) {
  return useQuery({
    queryKey: QUERY_KEYS.conversation(id),
    queryFn: () => conversationsApi.getById(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (query.state.status === 'error') return false;
      return 3000;
    },
    retry: (failureCount, error) => {
      if (error?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: conversationsApi.updateStatus,
    onSuccess: (_, variables) => {
      if (variables.id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversation(variables.id) });
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

