'use client';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

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

const getIntentOptions = (type) => {
    if (type === 'restaurant') {
        return [
            { value: 'all', label: 'All Intents' },
            { value: 'MENU_SEARCH', label: 'Menu Search' },
            { value: 'MENU_INFO', label: 'Menu Information' },
            { value: 'PLACE_ORDER', label: 'Place Order' },
            { value: 'ORDER_STATUS', label: 'Order Status' },
            { value: 'DEAL_INFO', label: 'Deal Information' },
            { value: 'SUPPORT', label: 'Support' },
        ];
    }
    return [
        { value: 'all', label: 'All Intents' },
        { value: 'PRODUCT_SEARCH', label: 'Product Search' },
        { value: 'PRODUCT_INFO', label: 'Product Information' },
        { value: 'PLACE_ORDER', label: 'Place Order' },
        { value: 'ORDER_STATUS', label: 'Order Status' },
        { value: 'SUPPORT', label: 'Support' },
    ];
};

const getAgentOptions = (type) => {
    if (type === 'restaurant') {
        return [
            { value: 'all', label: 'All Agents' },
            { value: 'MENU_AGENT', label: 'Menu Agent' },
            { value: 'ORDER_AGENT', label: 'Order Agent' },
            { value: 'DEAL_AGENT', label: 'Deal Agent' },
            { value: 'SUPPORT_AGENT', label: 'Support Agent' },
        ];
    }
    return [
        { value: 'all', label: 'All Agents' },
        { value: 'PRODUCT_AGENT', label: 'Product Agent' },
        { value: 'ORDER_AGENT', label: 'Order Agent' },
        { value: 'SUPPORT_AGENT', label: 'Support Agent' },
    ];
};

// ─── DATA UTILITIES (Mock Data Generation) ──────────────────────────────────

const generateMockCustomers = () => {
    const firstNames = ['Ahmed', 'Ali', 'Sara', 'Fatima', 'Mohammed', 'Zainab', 'Hassan', 'Layla', 'Omar', 'Aisha'];
    const lastNames = ['Khan', 'Ahmed', 'Ali', 'Hassan', 'Qureshi', 'Malik', 'Siddiqui', 'Rashid', 'Farooq', 'Noor'];
    const usernames = ['ahmed123', 'ali_tech', 'sara_89', 'fatima_2023', 'mohd_k', 'zainab_s', 'hassan_r', 'layla_m', 'omar_f', 'aisha_n'];

    return firstNames.map((first, index) => ({
        id: `cus_${String(index + 1).padStart(3, '0')}`,
        name: `${first} ${lastNames[index % lastNames.length]}`,
        username: usernames[index % usernames.length],
        telegramId: `${Math.floor(10000000 + Math.random() * 90000000)}`
    }));
};

const generateMockConversations = (count, businessType = 'ecommerce') => {
    const customers = generateMockCustomers();
    const statuses = ['RESOLVED', 'ACTIVE', 'ESCALATED', 'ABANDONED'];
    const statusWeights = [0.55, 0.15, 0.20, 0.10];

    const ecommerceIntents = ['PRODUCT_SEARCH', 'PRODUCT_INFO', 'PLACE_ORDER', 'ORDER_STATUS', 'SUPPORT'];
    const restaurantIntents = ['MENU_SEARCH', 'MENU_INFO', 'PLACE_ORDER', 'ORDER_STATUS', 'DEAL_INFO', 'SUPPORT'];

    const ecommerceAgents = ['PRODUCT_AGENT', 'ORDER_AGENT', 'SUPPORT_AGENT'];
    const restaurantAgents = ['MENU_AGENT', 'ORDER_AGENT', 'DEAL_AGENT', 'SUPPORT_AGENT'];

    const intents = businessType === 'restaurant' ? restaurantIntents : ecommerceIntents;
    const agents = businessType === 'restaurant' ? restaurantAgents : ecommerceAgents;

    const messages = [
        "I want to order 2 Zinger burgers",
        "Show me the latest products",
        "I have a problem with my order",
        "Is there any discount available?",
        "What's the status of my delivery?",
        "I need help with my account",
        "Can I return this product?",
        "Show me the menu",
        "I want to place a bulk order",
        "How long is the delivery time?",
        "I want to cancel my order",
        "What payment methods do you accept?",
        "I'm having trouble checking out",
        "Are there any deals available?",
        "I need support with my order"
    ];

    const conversations = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const status = statuses[
            statusWeights.reduce((acc, weight, index) => {
                if (Math.random() < weight) return index;
                return acc;
            }, 0)
        ];

        const customer = customers[Math.floor(Math.random() * customers.length)];
        const intent = intents[Math.floor(Math.random() * intents.length)];
        const agent = agents[Math.floor(Math.random() * agents.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];

        const date = new Date(now);
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        date.setHours(Math.floor(Math.random() * 24));
        date.setMinutes(Math.floor(Math.random() * 60));

        conversations.push({
            id: `conv_${String(i + 1).padStart(6, '0')}`,
            customer: {
                id: customer.id,
                name: customer.name,
                username: customer.username,
                telegramId: customer.telegramId
            },
            intent,
            agent,
            status,
            lastMessage: message,
            lastActivity: date.toISOString(),
        });
    }

    conversations.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    return conversations;
};

const generateStats = (conversations, dateRange) => {
    const total = conversations.length;
    const active = conversations.filter(c => c.status === 'ACTIVE').length;
    const resolved = conversations.filter(c => c.status === 'RESOLVED').length;
    const escalated = conversations.filter(c => c.status === 'ESCALATED').length;
    const abandoned = conversations.filter(c => c.status === 'ABANDONED').length;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;

    let changeMultiplier = 1;
    if (dateRange === 'today') changeMultiplier = 0.2;
    else if (dateRange === 'week') changeMultiplier = 0.7;
    else if (dateRange === 'month') changeMultiplier = 1;
    else if (dateRange === 'all') changeMultiplier = 1.5;

    return {
        total: total,
        totalChange: Math.round((5 + Math.random() * 15) * changeMultiplier),
        active: active,
        resolved: resolved,
        resolutionRate: resolutionRate,
        escalated: escalated,
        escalationRate: escalationRate,
        abandoned: abandoned,
    };
};

const getConversationStats = (dateRange = 'week', businessType = 'ecommerce') => {
    let count = 100;
    if (dateRange === 'today') count = 20;
    else if (dateRange === 'week') count = 100;
    else if (dateRange === 'month') count = 300;
    else if (dateRange === 'all') count = 500;

    const allConversations = generateMockConversations(count, businessType);
    return generateStats(allConversations, dateRange);
};

const getConversations = ({
    page = 1,
    limit = 10,
    search = '',
    status = null,
    intent = null,
    agent = null,
    dateRange = 'week',
    businessType = 'ecommerce'
}) => {
    let count = 200;
    if (dateRange === 'today') count = 50;
    else if (dateRange === 'week') count = 200;
    else if (dateRange === 'month') count = 500;
    else if (dateRange === 'all') count = 1000;

    const allConversations = generateMockConversations(count, businessType);

    let filtered = allConversations;
    if (status && status !== 'all') {
        filtered = filtered.filter(c => c.status === status);
    }
    if (intent && intent !== 'all') {
        filtered = filtered.filter(c => c.intent === intent);
    }
    if (agent && agent !== 'all') {
        filtered = filtered.filter(c => c.agent === agent);
    }
    if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(c =>
            c.customer.name.toLowerCase().includes(searchLower) ||
            c.customer.username?.toLowerCase().includes(searchLower) ||
            c.customer.telegramId.includes(searchLower) ||
            c.lastMessage.toLowerCase().includes(searchLower) ||
            c.status.toLowerCase().includes(searchLower) ||
            c.intent.toLowerCase().includes(searchLower)
        );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        }
    };
};

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

    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const businessType = 'ecommerce'; // Change to 'restaurant' for restaurant business

    // ─── Load Data ────────────────────────────────────────────────────────────

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            if (!isMounted) return;

            setLoading(true);
            try {
                const dateRange = filters.dateRange || 'all';
                const statsData = getConversationStats(dateRange, businessType);
                if (isMounted) setStats(statsData);

                const { data, pagination: paginationData } = getConversations({
                    page: filters.page,
                    limit: filters.limit,
                    search: filters.search || undefined,
                    status: (filters.status && filters.status !== 'all') ? filters.status : undefined,
                    intent: (filters.intent && filters.intent !== 'all') ? filters.intent : undefined,
                    agent: (filters.agent && filters.agent !== 'all') ? filters.agent : undefined,
                    dateRange,
                    businessType,
                });

                if (isMounted) {
                    setConversations(data);
                    setPagination(paginationData);
                }
            } catch (error) {
                console.error('Error loading conversations:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setIsFirstLoad(false);
                }
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [filters, businessType]);

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
                        @{conversation.customer.username || conversation.customer.telegramId}
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
                    label={getIntentBadge(conversation.intent)}
                />
            ),
        },
        {
            key: 'agent',
            header: 'Agent',
            headerClassName: 'min-w-[120px]',
            render: (conversation) => (
                <span className="text-sm">
                    {conversation.agent.replace(/_/g, ' ')}
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
                    {truncateMessage(conversation.lastMessage)}
                </span>
            ),
        },
        {
            key: 'lastActivity',
            header: 'Last Activity',
            headerClassName: 'min-w-[100px]',
            render: (conversation) => (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {timeAgo(conversation.lastActivity)}
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

    if (loading && conversations.length === 0 && isFirstLoad) {
        return (
            <div className="space-y-4 sm:space-y-6 pb-8">
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
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight sm:text-3xl">Conversations</h1>
                    <p className="text-sm text-muted-foreground">
                        Monitor customer conversations.
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
                    />
                    <StatCard
                        title="Active"
                        value={stats.active}
                        icon={MessageSquare}
                        caption="Currently active"
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.resolved}
                        icon={MessageSquare}
                        caption={`${stats.resolutionRate}% resolution rate`}
                    />
                    <StatCard
                        title="Escalated"
                        value={stats.escalated}
                        icon={MessageSquare}
                        caption={`${stats.escalationRate}% escalated`}
                    />
                </div>
            )}

            {/* Mobile: horizontally scrollable filters */}
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
                            options={getIntentOptions(businessType)}
                            onSelect={(v) => updateFilter('intent', v)}
                            menuLabel="Intent"
                            className="h-8 text-xs"
                            contentWidth="w-44"
                        />
                        <FilterDropdown
                            label="Agent"
                            options={getAgentOptions(businessType)}
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

            {/* Desktop: flex wrap filters */}
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
                    label={`Intent: ${getIntentOptions(businessType).find(s => s.value === filters.intent)?.label || 'All'}`}
                    options={getIntentOptions(businessType)}
                    onSelect={(v) => updateFilter('intent', v)}
                    menuLabel="Intent"
                />
                <FilterDropdown
                    label={`Agent: ${getAgentOptions(businessType).find(s => s.value === filters.agent)?.label || 'All'}`}
                    options={getAgentOptions(businessType)}
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