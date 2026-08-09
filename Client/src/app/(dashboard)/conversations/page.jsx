'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
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
    Search,
    Filter,
    ChevronDown,
    Eye,
    MessageSquare,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { smartFormat } from '@/lib/utils';
import StatCard from '@/components/dashboard/analytics-cards';

// FILTER COMPONENTS - Matching Deals Page Pattern
// ============================================================
const SearchInput = ({ value, onChange }) => (
    <div className="relative flex-1 min-w-37.5 sm:min-w-50">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
            placeholder="Search conversations..."
            value={value}
            onChange={(e) => onChange('search', e.target.value)}
            className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
        />
    </div>
);

const StatusFilter = ({ value, onChange, className = "" }) => {
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'ACTIVE', label: 'Active' },
        { value: 'RESOLVED', label: 'Resolved' },
        { value: 'ESCALATED', label: 'Escalated' },
        { value: 'ABANDONED', label: 'Abandoned' },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}>
                    <Filter className="h-3.5 w-3.5" />
                    Status: {statusOptions.find(s => s.value === value)?.label || 'All Status'}
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            } />
            <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {statusOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => onChange('status', option.value)}>
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const IntentFilter = ({ value, onChange, businessType = 'ecommerce', className = "" }) => {
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

    const intentOptions = getIntentOptions(businessType);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}>
                    <Filter className="h-3.5 w-3.5" />
                    Intent: {intentOptions.find(s => s.value === value)?.label || 'All Intents'}
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            } />
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Intent</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {intentOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => onChange('intent', option.value)}>
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const AgentFilter = ({ value, onChange, businessType = 'ecommerce', className = "" }) => {
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

    const agentOptions = getAgentOptions(businessType);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button variant="outline" size="sm" className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}>
                    <Filter className="h-3.5 w-3.5" />
                    Agent: {agentOptions.find(s => s.value === value)?.label || 'All Agents'}
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            } />
            <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Agent</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {agentOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => onChange('agent', option.value)}>
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const ClearFiltersButton = ({
    hasActiveFilters,
    onClear,
    className = ""
}) => {
    if (!hasActiveFilters) return null;

    return (
        <Button
            variant="destructive"
            size="sm"
            className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}
            onClick={onClear}
        >
            <X className="h-3.5 w-3.5" />
            Clear Filters
        </Button>
    );
};

// ============================================================
// CONVERSATION TABLE COMPONENT
// ============================================================
const getStatusBadge = (status) => {
    const statusConfig = {
        RESOLVED: {
            variant: 'default',
            className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100/80 dark:hover:bg-green-900/40'
        },
        ACTIVE: {
            variant: 'default',
            className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100/80 dark:hover:bg-blue-900/40'
        },
        ESCALATED: {
            variant: 'destructive',
            className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/40'
        },
        ABANDONED: {
            variant: 'outline',
            className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-900/40'
        }
    };

    const config = statusConfig[status] || statusConfig.ACTIVE;
    return (
        <Badge variant={config.variant} className={cn("text-[10px] sm:text-xs", config.className)}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
    );
};

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

const ConversationTable = ({ data, loading, pagination, onPageChange, currentPage }) => {
    if (loading) {
        return (
            <div className="rounded-xl border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                {['Customer', 'Intent', 'Agent', 'Status', 'Last Message', 'Last Activity', 'Actions'].map((header) => (
                                    <TableHead key={header}>{header}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                                <TableRow key={i}>
                                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                                        <TableCell key={j}>
                                            <div className={`h-4 bg-muted animate-pulse rounded ${j === 1 ? 'w-24' : j === 7 ? 'w-6' : 'w-16'}`}></div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="rounded-xl border py-12 sm:py-16 text-center bg-card">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold">No conversations found</h3>
                    <p className="text-sm text-muted-foreground max-w-md px-4">
                        Try adjusting your filters or search criteria.
                    </p>
                </div>
            </div>
        );
    }

    const { total, totalPages, limit } = pagination || { total: 0, totalPages: 1, limit: 10 };
    const startIndex = (currentPage - 1) * limit + 1;
    const endIndex = Math.min(currentPage * limit, total);

    const getPageNumbers = () => {
        const pages = [];
        const total = totalPages;
        const current = currentPage;
        const maxVisible = 5;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push('ellipsis');
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (current < total - 2) pages.push('ellipsis');
            if (!pages.includes(total)) pages.push(total);
        }
        return pages;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[140px]">Customer</TableHead>
                                <TableHead className="min-w-[120px]">Intent</TableHead>
                                <TableHead className="min-w-[120px]">Agent</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[150px]">Last Message</TableHead>
                                <TableHead className="min-w-[100px]">Last Activity</TableHead>
                                <TableHead className="w-[60px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((conversation) => (
                                <TableRow key={conversation.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">
                                                {conversation.customer.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                @{conversation.customer.username || conversation.customer.telegramId}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                                            {getIntentBadge(conversation.intent)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {conversation.agent.replace(/_/g, ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(conversation.status)}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {truncateMessage(conversation.lastMessage)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                                            {timeAgo(conversation.lastActivity)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/conversations/${conversation.id}`}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
                    <div className="whitespace-nowrap text-[10px] sm:text-sm text-muted-foreground">
                        Showing <span className="font-medium">{total === 0 ? 0 : startIndex}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, total)}</span>{' '}
                        of <span className="font-medium">{total}</span> results
                    </div>

                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage > 1) onPageChange(currentPage - 1);
                                    }}
                                    className={cn(
                                        'h-7 sm:h-9 text-xs sm:text-sm',
                                        currentPage <= 1 && 'pointer-events-none opacity-50'
                                    )}
                                />
                            </PaginationItem>

                            {getPageNumbers().map((p, index) => (
                                <PaginationItem key={index}>
                                    {p === 'ellipsis' ? (
                                        <PaginationEllipsis className="h-7 sm:h-9" />
                                    ) : (
                                        <PaginationLink
                                            href="#"
                                            isActive={p === currentPage}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onPageChange(p);
                                            }}
                                            className="h-7 sm:h-9 min-w-7 sm:min-w-9 text-xs sm:text-sm"
                                        >
                                            {p}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (currentPage < totalPages) onPageChange(currentPage + 1);
                                    }}
                                    className={cn(
                                        'h-7 sm:h-9 text-xs sm:text-sm',
                                        currentPage >= totalPages && 'pointer-events-none opacity-50'
                                    )}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// DATA UTILITIES (Mock Data Generation)
// ============================================================
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

// ============================================================
// MAIN CONVERSATIONS PAGE
// ============================================================
const ConversationsPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getFilterValue = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    const [filters, setFilters] = useState(() => ({
        page: parseInt(getFilterValue('page', '1')),
        limit: parseInt(getFilterValue('limit', '10')),
        search: getFilterValue('search', ''),
        status: getFilterValue('status', 'all'),
        intent: getFilterValue('intent', 'all'),
        agent: getFilterValue('agent', 'all'),
        dateRange: getFilterValue('dateRange', 'all'),
    }));

    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [stats, setStats] = useState(null);
    const [pagination, setPagination] = useState(null);

    const businessType = 'ecommerce'; // Change to 'restaurant' for restaurant business

    // Use ref to prevent unnecessary effect runs
    const isInitialMount = useRef(true);

    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== '' && value !== 'all') {
                params.set(key, value);
            }
        });
        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
    }, [router]);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => {
            const newParams = { ...prev };
            if (value && value !== '' && value !== 'all') {
                newParams[key] = value;
            } else {
                newParams[key] = key === 'page' ? 1 : '';
                if (key !== 'page') {
                    newParams.page = 1;
                }
            }
            if (key !== 'page') {
                newParams.page = 1;
            }
            return newParams;
        });
    }, []);

    // ============================================================
    // LOAD DATA FUNCTION - Declared BEFORE useEffect
    // ============================================================
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const statsData = getConversationStats(filters.dateRange, businessType);
            setStats(statsData);

            const { data, pagination: paginationData } = getConversations({
                page: filters.page,
                limit: filters.limit,
                search: filters.search || undefined,
                status: filters.status !== 'all' ? filters.status : undefined,
                intent: filters.intent !== 'all' ? filters.intent : undefined,
                agent: filters.agent !== 'all' ? filters.agent : undefined,
                dateRange: filters.dateRange,
                businessType,
            });

            setConversations(data);
            setPagination(paginationData);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [filters, businessType]);
    // ============================================================
    // END OF LOAD DATA FUNCTION
    // ============================================================

    // ============================================================
    // EFFECTS
    // ============================================================
    // Effect for updating URL
    useEffect(() => {
        updateURL(filters);
    }, [filters, updateURL]);

    // Effect for loading data - using a flag to prevent initial double render
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            loadData();
        } else {
            loadData();
        }
    }, [loadData]);

    const handlePageChange = (page) => {
        updateFilter('page', page);
    };

    const hasActiveFilters = filters.search ||
        filters.status !== 'all' ||
        filters.intent !== 'all' ||
        filters.agent !== 'all';

    const clearAllFilters = () => {
        const newFilters = {
            page: 1,
            limit: 10,
            search: '',
            status: 'all',
            intent: 'all',
            agent: 'all',
            dateRange: filters.dateRange,
        };
        setFilters(newFilters);
    };

    // Helper function to get display label for date range
    const getDateRangeLabel = (value) => {
        switch (value) {
            case 'all':
                return 'All';
            case 'today':
                return 'Today';
            case 'week':
                return 'Week';
            case 'month':
                return 'Month';
            default:
                return 'Week';
        }
    };

    // Loading skeleton
    if (loading && !conversations.length) {
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
                        icon={MessageSquare}
                        trend={stats.totalChange > 0 ? 'up' : 'down'}
                        type="number"
                    />
                    <StatCard
                        title="Active"
                        value={stats.active}
                        change={0}
                        icon={MessageSquare}
                        trend="up"
                        type="number"
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.resolved}
                        change={stats.resolutionRate}
                        icon={MessageSquare}
                        trend="up"
                        type="number"
                    />
                    <StatCard
                        title="Escalated"
                        value={stats.escalated}
                        change={stats.escalationRate}
                        icon={MessageSquare}
                        trend="down"
                        type="number"
                    />
                </div>
            )}

            {/* Mobile: horizontally scrollable filters */}
            <div className="md:hidden relative">
                <div className="overflow-x-auto scrollbar-thin pt-1 pb-2.5">
                    <div className="flex items-center gap-2 min-w-max">
                        <div className="relative min-w-[160px] w-[160px]">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search conversations..."
                                value={filters.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>
                        <StatusFilter
                            value={filters.status}
                            onChange={updateFilter}
                            className="h-8 text-xs"
                        />
                        <IntentFilter
                            value={filters.intent}
                            onChange={updateFilter}
                            businessType={businessType}
                            className="h-8 text-xs"
                        />
                        <AgentFilter
                            value={filters.agent}
                            onChange={updateFilter}
                            businessType={businessType}
                            className="h-8 text-xs"
                        />
                        <ClearFiltersButton
                            hasActiveFilters={hasActiveFilters}
                            onClear={clearAllFilters}
                            className="h-8 text-xs whitespace-nowrap"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop: original UI with flex wrap */}
            <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <SearchInput value={filters.search} onChange={updateFilter} />
                <StatusFilter value={filters.status} onChange={updateFilter} />
                <IntentFilter value={filters.intent} onChange={updateFilter} businessType={businessType} />
                <AgentFilter value={filters.agent} onChange={updateFilter} businessType={businessType} />
                <ClearFiltersButton
                    hasActiveFilters={hasActiveFilters}
                    onClear={clearAllFilters}
                />
            </div>

            {/* Table */}
            <ConversationTable
                data={conversations}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
                currentPage={filters.page}
            />
        </div>
    );
};

export default ConversationsPage;