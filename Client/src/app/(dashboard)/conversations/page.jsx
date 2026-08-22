'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Eye,
    MessageSquare,
    ChevronDown,
    MessageCircle,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';
import { useSocket } from '@/contexts/SocketContext';
import { useConversations, useConversationStats } from '@/hooks/useApi';

// ─── Helper Functions ─────────────────────────────────────────────────────────

const getIntentBadge = (intent) => {
    const intentMap = {
        PRODUCT_SEARCH: 'Product Search',
        PRODUCT_INFO: 'Product Information',
        PLACE_ORDER: 'Place Order',
        ORDER_STATUS: 'Order Status',
        SUPPORT: 'Support',
        MENU_SEARCH: 'Menu Search',
        MENU_INFO: 'Menu Information',
        DEAL_INFO: 'Deal Information',
    };
    return intentMap[intent] || intent.replace(/_/g, ' ');
};

const timeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const truncateMessage = (message, maxLength = 30) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
};

// ─── Filter Option Configs ──────────────────────────────────────────────────

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'ESCALATED', label: 'Escalated' },
    { value: 'ABANDONED', label: 'Abandoned' },
];

const INTENT_OPTIONS = [
    { value: 'all', label: 'All Intents' },
    { value: 'MENU_SEARCH', label: 'Menu Search' },
    { value: 'MENU_INFO', label: 'Menu Information' },
    { value: 'PLACE_ORDER', label: 'Place Order' },
    { value: 'ORDER_STATUS', label: 'Order Status' },
    { value: 'DEAL_INFO', label: 'Deal Information' },
    { value: 'SUPPORT', label: 'Support' },
];

const AGENT_OPTIONS = [
    { value: 'all', label: 'All Agents' },
    { value: 'MENU_AGENT', label: 'Menu Agent' },
    { value: 'ORDER_AGENT', label: 'Order Agent' },
    { value: 'DEAL_AGENT', label: 'Deal Agent' },
    { value: 'SUPPORT_AGENT', label: 'Support Agent' },
];

// ─── Filter Defaults ─────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    intent: 'all',
    agent: 'all',
    dateRange: 'all',
};

// ─── Main Component ──────────────────────────────────────────────────────────

const ConversationsPage = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);
    const { socket, isConnected } = useSocket();

    // Use ref to track if we've already processed a socket event
    const processingRef = useRef(false);

    const [conversations, setConversations] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
    const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, resolutionRate: 0, escalated: 0, escalationRate: 0 });

    const { data: statsResponse, refetch: refetchStats } = useConversationStats(filters.dateRange || 'all');
    const { data: responseData, isLoading: loading } = useConversations({
        page: filters.page,
        limit: filters.limit,
        search: filters.search || undefined,
        status: (filters.status && filters.status !== 'all') ? filters.status : undefined,
        intent: (filters.intent && filters.intent !== 'all') ? filters.intent : undefined,
        agent: (filters.agent && filters.agent !== 'all') ? filters.agent : undefined,
        dateRange: filters.dateRange || 'all',
    });

    // Update data from API responses - only when responseData actually changes
    useEffect(() => {
        if (responseData?.data) {
            setConversations(responseData.data);
        }
        if (responseData?.pagination) {
            setPagination(responseData.pagination);
        }
    }, [responseData]);

    useEffect(() => {
        if (statsResponse?.data) {
            setStats(statsResponse.data);
        }
    }, [statsResponse]);

    // ─── Socket Event Listeners ─────────────────────────────────────────────

    useEffect(() => {
        if (!socket) return;

        const handleNewConversation = (newConversation) => {
            setConversations((prev) => {
                const exists = prev.some(conv => conv.id === newConversation.id);
                if (exists) return prev;
                return [newConversation, ...prev];
            });

            setPagination((prev) => ({
                ...prev,
                total: prev.total + 1,
            }));

            refetchStats();
        };

        const handleConversationUpdated = (updatedData) => {
            setConversations((prev) => {
                const updated = prev.map((conv) => {
                    if (conv.id === updatedData.conversationId) {
                        return {
                            ...conv,
                            lastMessage: updatedData.lastMessage || conv.lastMessage,
                            lastActivity: updatedData.lastActivity || conv.lastActivity,
                        };
                    }
                    return conv;
                });

                const updatedConv = updated.find(c => c.id === updatedData.conversationId);
                if (updatedConv) {
                    const rest = updated.filter(c => c.id !== updatedData.conversationId);
                    return [updatedConv, ...rest];
                }
                return updated;
            });

            refetchStats();
        };

        const handleStatusUpdated = (data) => {
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === data.conversationId) {
                        return {
                            ...conv,
                            status: data.status,
                        };
                    }
                    return conv;
                });
            });

            refetchStats();
        };

        socket.on('new-conversation', handleNewConversation);
        socket.on('conversation-updated', handleConversationUpdated);
        socket.on('conversation-status-updated', handleStatusUpdated);

        return () => {
            socket.off('new-conversation', handleNewConversation);
            socket.off('conversation-updated', handleConversationUpdated);
            socket.off('conversation-status-updated', handleStatusUpdated);
        };
    }, [socket, refetchStats]);

    // ─── Handlers ────────────────────────────────────────────────────────────

    const handlePageChange = (page) => {
        updateFilter('page', page);
    };

    const hasActiveFilters = filters.search ||
        (filters.status && filters.status !== 'all') ||
        (filters.intent && filters.intent !== 'all') ||
        (filters.agent && filters.agent !== 'all');

    const clearAllFilters = () => {
        resetFilters({ ...FILTER_DEFAULTS, dateRange: filters.dateRange });
    };

    const getDateRangeLabel = (value) => {
        switch (value) {
            case 'all':
            case '':
                return 'All';
            case 'today':
                return 'Today';
            case 'week':
                return 'Week';
            case 'month':
                return 'Month';
            default:
                return 'All';
        }
    };

    // ─── Column Definitions ─────────────────────────────────────────────────

    const columns = [
        {
            key: 'customer',
            header: 'Customer',
            headerClassName: 'min-w-[140px]',
            render: (conversation) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {conversation.customer.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {conversation.customer.username
                            ? conversation.customer.displayUsername || `@${conversation.customer.username}`
                            : `ID: ${conversation.customer.telegramId}`}
                    </span>
                </div>
            ),
        },
        {
            key: 'intent',
            header: 'Intent',
            headerClassName: 'min-w-[120px]',
            render: (conversation) => (
                <StatusBadge
                    status="intent"
                    label={conversation.intent ? getIntentBadge(conversation.intent) : '-'}
                />
            ),
        },
        {
            key: 'agent',
            header: 'Agent',
            headerClassName: 'min-w-[120px]',
            render: (conversation) => (
                <span className="text-sm">
                    {conversation.agent ? conversation.agent.replace(/_/g, ' ') : '-'}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-[100px]',
            render: (conversation) => (
                <StatusBadge status={conversation.status} />
            ),
        },
        {
            key: 'lastMessage',
            header: 'Last Message',
            headerClassName: 'min-w-[150px]',
            render: (conversation) => (
                <span className="text-sm text-muted-foreground">
                    {conversation.lastMessage ? truncateMessage(conversation.lastMessage) : '-'}
                </span>
            ),
        },
        {
            key: 'lastActivity',
            header: 'Last Activity',
            headerClassName: 'min-w-[100px]',
            render: (conversation) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {conversation.lastActivity ? timeAgo(conversation.lastActivity) : '-'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'w-[60px] text-right',
            cellClassName: 'text-right',
            render: (conversation) => (
                <Link href={`/conversations/${conversation.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                </Link>
            ),
        },
    ];

    // ─── Loading State ──────────────────────────────────────────────────────

    if (loading && conversations.length === 0) {
        return (
            <div className="space-y-4 sm:space-y-6 pb-8">
                {/* Loading skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="h-7 sm:h-8 w-32 sm:w-48 bg-muted animate-pulse rounded"></div>
                        <div className="h-3 sm:h-4 w-64 sm:w-96 bg-muted animate-pulse rounded mt-1.5 sm:mt-2"></div>
                    </div>
                    <div className="h-8 sm:h-9 w-28 sm:w-32 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 sm:h-28 bg-muted animate-pulse rounded-lg"></div>
                    ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <div className="h-8 sm:h-9 flex-1 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 sm:h-9 w-28 sm:w-32 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 sm:h-9 w-28 sm:w-32 bg-muted animate-pulse rounded"></div>
                    <div className="h-8 sm:h-9 w-28 sm:w-32 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="rounded-xl border overflow-hidden">
                    <div className="h-10 sm:h-12 bg-muted animate-pulse"></div>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="h-14 sm:h-16 border-t bg-muted/20 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Connection Status Indicator */}
            {!isConnected && (
                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    Connecting to real-time updates...
                </div>
            )}

            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight sm:text-3xl">Conversations</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor customer conversations in real-time.
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Date Range</span>
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1 w-20">
                                {getDateRangeLabel(filters.dateRange)}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Date Range</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateFilter('dateRange', 'all')}>
                                    All
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('dateRange', 'today')}>
                                    Today
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('dateRange', 'week')}>
                                    Week (Last 7 Days)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('dateRange', 'month')}>
                                    Month (Last 30 Days)
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Conversations"
                        value={stats.total}
                        change={stats.totalChange}
                        trend={stats.totalChange > 0 ? 'up' : 'down'}
                        icon={MessageSquare}
                        iconClassName="text-chart-1"
                        valueClassName="text-chart-1"
                        caption="All conversations"
                    />
                    <StatCard
                        title="Active"
                        value={stats.active}
                        icon={MessageCircle}
                        iconClassName="text-chart-2"
                        valueClassName="text-chart-2"
                        caption="Currently active"
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.resolved}
                        icon={CheckCircle}
                        iconClassName="text-chart-3"
                        valueClassName="text-chart-3"
                        caption={`${stats.resolutionRate}% resolution rate`}
                    />
                    <StatCard
                        title="Escalated"
                        value={stats.escalated}
                        icon={AlertCircle}
                        iconClassName="text-destructive"
                        valueClassName="text-destructive"
                        caption={`${stats.escalationRate}% escalated`}
                    />
                </div>
            )}

            {/* Mobile filters */}
            <div className="md:hidden relative">
                <div className="overflow-x-auto scrollbar-thin pt-1 pb-2.5">
                    <div className="flex items-center gap-2 min-w-max">
                        <FilterSearchInput
                            placeholder="Search conversations..."
                            value={filters.search}
                            onChange={updateFilter}
                            className="relative min-w-[160px] w-[160px]"
                            inputClassName="h-8 text-xs"
                        />
                        <FilterDropdown
                            label="Status"
                            options={STATUS_OPTIONS}
                            onSelect={(v) => updateFilter('status', v)}
                            menuLabel="Status"
                            className="h-8 text-xs"
                            contentWidth="w-40"
                        />
                        <FilterDropdown
                            label="Intent"
                            options={INTENT_OPTIONS}
                            onSelect={(v) => updateFilter('intent', v)}
                            menuLabel="Intent"
                            className="h-8 text-xs"
                            contentWidth="w-44"
                        />
                        <FilterDropdown
                            label="Agent"
                            options={AGENT_OPTIONS}
                            onSelect={(v) => updateFilter('agent', v)}
                            menuLabel="Agent"
                            className="h-8 text-xs"
                            contentWidth="w-44"
                        />
                        {hasActiveFilters && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap shrink-0"
                                onClick={clearAllFilters}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop filters */}
            <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <FilterSearchInput
                    placeholder="Search conversations..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="flex-1 min-w-37.5 sm:min-w-50"
                />
                <FilterDropdown
                    label={`Status: ${STATUS_OPTIONS.find(s => s.value === filters.status)?.label || 'All'}`}
                    options={STATUS_OPTIONS}
                    onSelect={(v) => updateFilter('status', v)}
                    menuLabel="Status"
                />
                <FilterDropdown
                    label={`Intent: ${INTENT_OPTIONS.find(s => s.value === filters.intent)?.label || 'All'}`}
                    options={INTENT_OPTIONS}
                    onSelect={(v) => updateFilter('intent', v)}
                    menuLabel="Intent"
                />
                <FilterDropdown
                    label={`Agent: ${AGENT_OPTIONS.find(s => s.value === filters.agent)?.label || 'All'}`}
                    options={AGENT_OPTIONS}
                    onSelect={(v) => updateFilter('agent', v)}
                    menuLabel="Agent"
                />
                {hasActiveFilters && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={clearAllFilters}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Table + Pagination */}
            <DataTable
                columns={columns}
                data={conversations}
                getRowKey={(conv) => conv.id}
                emptyMessage="No conversations found."
                tableMinWidth="min-w-[900px]"
                footer={
                    <PaginationFooter
                        page={filters.page}
                        totalPages={pagination?.totalPages || 1}
                        totalFiltered={pagination?.total || 0}
                        startIndex={(filters.page - 1) * (pagination?.limit || 10)}
                        endIndex={Math.min(filters.page * (pagination?.limit || 10), pagination?.total || 0)}
                        onPageChange={handlePageChange}
                        getPageNums={getPageNums}
                    />
                }
            />
        </div>
    );
};

export default ConversationsPage;

