'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    ShoppingBag,
    CheckCircle,
    XCircle,
    Search,
    Filter,
    ChevronDown,
    Eye,
    MoreVertical,
    Calendar,
    Loader2,
    Clock,
    AlertCircle,
    Check,
    Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy Data
const DUMMY_ORDERS = [
    {
        _id: 'ord_001',
        orderNumber: 'ORD-2024-001',
        customer: { name: 'John Doe', phone: '+1 (555) 123-4567' },
        total: 157.99,
        status: 'completed',
        createdAt: '2024-01-15T10:30:00Z',
        items: 3,
    },
    {
        _id: 'ord_002',
        orderNumber: 'ORD-2024-002',
        customer: { name: 'Jane Smith', phone: '+1 (555) 234-5678' },
        total: 89.50,
        status: 'pending',
        createdAt: '2024-01-15T11:45:00Z',
        items: 2,
    },
    {
        _id: 'ord_003',
        orderNumber: 'ORD-2024-003',
        customer: { name: 'Bob Johnson', phone: '+1 (555) 345-6789' },
        total: 234.99,
        status: 'confirmed',
        createdAt: '2024-01-14T14:20:00Z',
        items: 5,
    },
    {
        _id: 'ord_004',
        orderNumber: 'ORD-2024-004',
        customer: { name: 'Sarah Williams', phone: '+1 (555) 456-7890' },
        total: 45.00,
        status: 'cancelled',
        createdAt: '2024-01-14T09:15:00Z',
        items: 1,
    },
    {
        _id: 'ord_005',
        orderNumber: 'ORD-2024-005',
        customer: { name: 'Mike Brown', phone: '+1 (555) 567-8901' },
        total: 312.50,
        status: 'processing',
        createdAt: '2024-01-13T16:45:00Z',
        items: 4,
    },
    {
        _id: 'ord_006',
        orderNumber: 'ORD-2024-006',
        customer: { name: 'Emily Davis', phone: '+1 (555) 678-9012' },
        total: 76.99,
        status: 'completed',
        createdAt: '2024-01-13T11:00:00Z',
        items: 2,
    },
    {
        _id: 'ord_007',
        orderNumber: 'ORD-2024-007',
        customer: { name: 'David Wilson', phone: '+1 (555) 789-0123' },
        total: 189.99,
        status: 'pending',
        createdAt: '2024-01-12T13:20:00Z',
        items: 3,
    },
    {
        _id: 'ord_008',
        orderNumber: 'ORD-2024-008',
        customer: { name: 'Lisa Anderson', phone: '+1 (555) 890-1234' },
        total: 54.50,
        status: 'confirmed',
        createdAt: '2024-01-12T10:00:00Z',
        items: 1,
    },
    {
        _id: 'ord_009',
        orderNumber: 'ORD-2024-009',
        customer: { name: 'Tom Martinez', phone: '+1 (555) 901-2345' },
        total: 423.99,
        status: 'processing',
        createdAt: '2024-01-11T15:30:00Z',
        items: 6,
    },
    {
        _id: 'ord_010',
        orderNumber: 'ORD-2024-010',
        customer: { name: 'Rachel Taylor', phone: '+1 (555) 012-3456' },
        total: 67.50,
        status: 'cancelled',
        createdAt: '2024-01-11T08:45:00Z',
        items: 2,
    },
    {
        _id: 'ord_011',
        orderNumber: 'ORD-2024-011',
        customer: { name: 'Chris Lee', phone: '+1 (555) 123-7890' },
        total: 145.00,
        status: 'completed',
        createdAt: '2024-01-10T14:10:00Z',
        items: 3,
    },
    {
        _id: 'ord_012',
        orderNumber: 'ORD-2024-012',
        customer: { name: 'Amanda White', phone: '+1 (555) 234-8901' },
        total: 98.99,
        status: 'pending',
        createdAt: '2024-01-10T09:30:00Z',
        items: 2,
    },
];

// Status configuration
const STATUS_CONFIG = {
    pending: { label: 'Pending', variant: 'warning', icon: Clock },
    confirmed: { label: 'Confirmed', variant: 'info', icon: Check },
    processing: { label: 'Processing', variant: 'secondary', icon: Package },
    completed: { label: 'Completed', variant: 'success', icon: CheckCircle },
    cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const OrdersList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get filter values from URL query params
    const getFilterValue = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    // Initialize state from URL
    const [searchParamsState, setSearchParamsState] = useState({
        page: parseInt(getFilterValue('page', '1')),
        limit: parseInt(getFilterValue('limit', '10')),
        search: getFilterValue('search', ''),
        status: getFilterValue('status', 'all'),
        dateFrom: getFilterValue('dateFrom', ''),
        dateTo: getFilterValue('dateTo', ''),
    });

    // Dialog states for date range
    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [tempDateFrom, setTempDateFrom] = useState(searchParamsState.dateFrom);
    const [tempDateTo, setTempDateTo] = useState(searchParamsState.dateTo);

    // Update URL when filters change
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

    // Update filter
    const updateFilter = useCallback((key, value) => {
        setSearchParamsState(prev => {
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

    // Effect to update URL when state changes
    useEffect(() => {
        updateURL(searchParamsState);
    }, [searchParamsState, updateURL]);

    // Memoized filtered orders
    const filteredOrders = useMemo(() => {
        let filtered = [...DUMMY_ORDERS];

        // Search filter (by customer name or phone)
        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.customer.name.toLowerCase().includes(searchLower) ||
                order.customer.phone.toLowerCase().includes(searchLower) ||
                order.orderNumber.toLowerCase().includes(searchLower)
            );
        }

        // Status filter
        if (searchParamsState.status && searchParamsState.status !== 'all') {
            filtered = filtered.filter(order => order.status === searchParamsState.status);
        }

        // Date range filter
        if (searchParamsState.dateFrom) {
            const fromDate = new Date(searchParamsState.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate >= fromDate;
            });
        }
        if (searchParamsState.dateTo) {
            const toDate = new Date(searchParamsState.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate <= toDate;
            });
        }

        return filtered;
    }, [searchParamsState]);

    // Get stats
    const totalOrders = DUMMY_ORDERS.length;
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'completed').length;
    const cancelledOrders = DUMMY_ORDERS.filter(o => o.status === 'cancelled').length;

    // Pagination
    const totalFiltered = filteredOrders.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatOrderId = (id) => {
        return id.split('-').pop().toUpperCase();
    };

    const getPageNumbers = () => {
        const total = totalPages;
        const current = searchParamsState.page;
        const pages = [];
        const maxVisible = 5;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (current > 3) {
                pages.push('ellipsis');
            }
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            if (current < total - 2) {
                pages.push('ellipsis');
            }
            if (!pages.includes(total)) {
                pages.push(total);
            }
        }
        return pages;
    };

    const getStatusBadge = (status) => {
        const config = STATUS_CONFIG[status];
        const variantMap = {
            warning: 'default',
            info: 'default',
            secondary: 'secondary',
            success: 'default',
            destructive: 'destructive',
        };

        const colorMap = {
            warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
            info: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
            secondary: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
            success: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
            destructive: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400',
        };

        const Icon = config.icon;

        return (
            <Badge
                variant={variantMap[config.variant]}
                className={cn(
                    "text-[10px] font-medium gap-1",
                    colorMap[config.variant]
                )}
            >
                <Icon className="h-3 w-3" />
                {config.label}
            </Badge>
        );
    };

    const getStatusLabel = (status) => {
        if (status === 'all') return 'All';
        return STATUS_CONFIG[status]?.label || status;
    };

    // Handle date range apply
    const handleDateRangeApply = () => {
        updateFilter('dateFrom', tempDateFrom);
        updateFilter('dateTo', tempDateTo);
        setIsDateDialogOpen(false);
    };

    // Handle date range clear
    const handleDateRangeClear = () => {
        setTempDateFrom('');
        setTempDateTo('');
        updateFilter('dateFrom', '');
        updateFilter('dateTo', '');
        setIsDateDialogOpen(false);
    };

    const hasActiveFilters = searchParamsState.search ||
        searchParamsState.status !== 'all' ||
        searchParamsState.dateFrom ||
        searchParamsState.dateTo;

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Orders</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage and track your orders.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalOrders}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Completed Orders</CardTitle>
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-green-500">{completedOrders}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((completedOrders / totalOrders) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Cancelled Orders</CardTitle>
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-destructive">{cancelledOrders}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((cancelledOrders / totalOrders) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters - Side by Side */}
            <div className="flex flex-row gap-3 ">
                {/* Search Input */}
                <div className="relative flex-1 max-w-140">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by customer name, phone or order ID..."
                        value={searchParamsState.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8 h-8 sm:h-9 text-xs sm:text-sm w-full"
                    />
                </div>

                {/* Status Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1 min-w-[140px]">
                            <Filter className="h-3.5 w-3.5" />
                            Status: {getStatusLabel(searchParamsState.status)}
                            <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                        </Button>
                    } />
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateFilter('status', 'all')}>
                                All
                            </DropdownMenuItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <DropdownMenuItem key={key} onClick={() => updateFilter('status', key)}>
                                    <config.icon className="mr-2 h-3.5 w-3.5" />
                                    {config.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Date Range Filter */}
                <div className="hidden md:flex">
                    <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                        <DialogTrigger render={
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 sm:h-9 text-xs sm:text-sm gap-1 min-w-[140px]"
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                {searchParamsState.dateFrom || searchParamsState.dateTo ? (
                                    <span className="text-primary">
                                        {searchParamsState.dateFrom && searchParamsState.dateTo ? (
                                            `${new Date(searchParamsState.dateFrom).toLocaleDateString()} - ${new Date(searchParamsState.dateTo).toLocaleDateString()}`
                                        ) : searchParamsState.dateFrom ? (
                                            `From ${new Date(searchParamsState.dateFrom).toLocaleDateString()}`
                                        ) : (
                                            `To ${new Date(searchParamsState.dateTo).toLocaleDateString()}`
                                        )}
                                    </span>
                                ) : (
                                    'Date Range'
                                )}
                                <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                            </Button>
                        } />
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Date Range</DialogTitle>
                                <DialogDescription>
                                    Select a date range to filter orders.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">From</label>
                                    <Input
                                        type="date"
                                        value={tempDateFrom}
                                        onChange={(e) => setTempDateFrom(e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">To</label>
                                    <Input
                                        type="date"
                                        value={tempDateTo}
                                        onChange={(e) => setTempDateTo(e.target.value)}
                                        className="h-10 text-sm"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={handleDateRangeClear}>
                                    Clear
                                </Button>
                                <Button onClick={handleDateRangeApply}>
                                    Apply
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => {
                            const newFilters = {
                                page: 1,
                                limit: 10,
                                search: '',
                                status: 'all',
                                dateFrom: '',
                                dateTo: '',
                            };
                            setSearchParamsState(newFilters);
                            setTempDateFrom('');
                            setTempDateTo('');
                        }}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Table - Horizontally scrollable with hidden scrollbar on large screens */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[100px] ">Order ID</TableHead>
                                <TableHead className="min-w-[80px] ">Customer</TableHead>
                                <TableHead className="min-w-[100px]  text-right">Total</TableHead>
                                <TableHead className="min-w-[160px]  text-center">Status</TableHead>
                                <TableHead className="min-w-[100px] text-center">Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                                        No orders found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <TableRow
                                        key={order._id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => router.push(`/orders/${order._id}`)}
                                    >
                                        <TableCell className="font-mono text-xs font-medium">
                                            {formatOrderId(order.orderNumber)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{order.customer.name}</div>
                                            <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            ${order.total.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(order.status)}
                                        </TableCell>
                                        <TableCell className="text-xs text-center text-muted-foreground">
                                            {formatDate(order.createdAt)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
                    <div className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                        Showing <span className="font-medium">{totalFiltered === 0 ? 0 : startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, totalFiltered)}</span>{' '}
                        of <span className="font-medium">{totalFiltered}</span> results
                    </div>

                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (searchParamsState.page > 1) updateFilter('page', searchParamsState.page - 1);
                                    }}
                                    className={cn(
                                        'h-8 sm:h-9 text-xs sm:text-sm',
                                        searchParamsState.page <= 1 && 'pointer-events-none opacity-50'
                                    )}
                                />
                            </PaginationItem>

                            {getPageNumbers().map((p, index) => (
                                <PaginationItem key={index}>
                                    {p === 'ellipsis' ? (
                                        <PaginationEllipsis className="h-8 sm:h-9" />
                                    ) : (
                                        <PaginationLink
                                            href="#"
                                            isActive={p === searchParamsState.page}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilter('page', p);
                                            }}
                                            className="h-8 sm:h-9 min-w-8 sm:min-w-9 text-xs sm:text-sm"
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
                                        if (searchParamsState.page < totalPages) updateFilter('page', searchParamsState.page + 1);
                                    }}
                                    className={cn(
                                        'h-8 sm:h-9 text-xs sm:text-sm',
                                        searchParamsState.page >= totalPages && 'pointer-events-none opacity-50'
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

export default OrdersList;