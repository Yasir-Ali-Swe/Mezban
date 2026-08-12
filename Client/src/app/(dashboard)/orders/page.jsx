'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    ShoppingBag,
    CheckCircle,
    XCircle,
    Filter,
    ChevronDown,
    Calendar,
    Clock,
    Check,
    Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    StatsCard,
    FilterSearchInput,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_ORDERS = [
    { _id: 'ord_001', orderNumber: 'ORD-2024-001', customer: { name: 'John Doe', phone: '+1 (555) 123-4567' }, total: 157.99, status: 'completed', createdAt: '2024-01-15T10:30:00Z', items: 3 },
    { _id: 'ord_002', orderNumber: 'ORD-2024-002', customer: { name: 'Jane Smith', phone: '+1 (555) 234-5678' }, total: 89.50, status: 'pending', createdAt: '2024-01-15T11:45:00Z', items: 2 },
    { _id: 'ord_003', orderNumber: 'ORD-2024-003', customer: { name: 'Bob Johnson', phone: '+1 (555) 345-6789' }, total: 234.99, status: 'confirmed', createdAt: '2024-01-14T14:20:00Z', items: 5 },
    { _id: 'ord_004', orderNumber: 'ORD-2024-004', customer: { name: 'Sarah Williams', phone: '+1 (555) 456-7890' }, total: 45.00, status: 'cancelled', createdAt: '2024-01-14T09:15:00Z', items: 1 },
    { _id: 'ord_005', orderNumber: 'ORD-2024-005', customer: { name: 'Mike Brown', phone: '+1 (555) 567-8901' }, total: 312.50, status: 'processing', createdAt: '2024-01-13T16:45:00Z', items: 4 },
    { _id: 'ord_006', orderNumber: 'ORD-2024-006', customer: { name: 'Emily Davis', phone: '+1 (555) 678-9012' }, total: 76.99, status: 'completed', createdAt: '2024-01-13T11:00:00Z', items: 2 },
    { _id: 'ord_007', orderNumber: 'ORD-2024-007', customer: { name: 'David Wilson', phone: '+1 (555) 789-0123' }, total: 189.99, status: 'pending', createdAt: '2024-01-12T13:20:00Z', items: 3 },
    { _id: 'ord_008', orderNumber: 'ORD-2024-008', customer: { name: 'Lisa Anderson', phone: '+1 (555) 890-1234' }, total: 54.50, status: 'confirmed', createdAt: '2024-01-12T10:00:00Z', items: 1 },
    { _id: 'ord_009', orderNumber: 'ORD-2024-009', customer: { name: 'Tom Martinez', phone: '+1 (555) 901-2345' }, total: 423.99, status: 'processing', createdAt: '2024-01-11T15:30:00Z', items: 6 },
    { _id: 'ord_010', orderNumber: 'ORD-2024-010', customer: { name: 'Rachel Taylor', phone: '+1 (555) 012-3456' }, total: 67.50, status: 'cancelled', createdAt: '2024-01-11T08:45:00Z', items: 2 },
    { _id: 'ord_011', orderNumber: 'ORD-2024-011', customer: { name: 'Chris Lee', phone: '+1 (555) 123-7890' }, total: 145.00, status: 'completed', createdAt: '2024-01-10T14:10:00Z', items: 3 },
    { _id: 'ord_012', orderNumber: 'ORD-2024-012', customer: { name: 'Amanda White', phone: '+1 (555) 234-8901' }, total: 98.99, status: 'pending', createdAt: '2024-01-10T09:30:00Z', items: 2 },
];

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending:    { label: 'Pending',    icon: Clock,        colorClass: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400' },
    confirmed:  { label: 'Confirmed',  icon: Check,        colorClass: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
    processing: { label: 'Processing', icon: Package,      colorClass: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400' },
    completed:  { label: 'Completed',  icon: CheckCircle,  colorClass: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
    cancelled:  { label: 'Cancelled',  icon: XCircle,      colorClass: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
};

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

const formatOrderId = (id) => id.split('-').pop().toUpperCase();

const getStatusLabel = (status) => STATUS_CONFIG[status]?.label || 'All';

const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status];
    if (!config) return null;
    const Icon = config.icon;
    return (
        <Badge variant="default" className={cn('text-[10px] font-medium gap-1', config.colorClass)}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────

const OrdersList = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
    const [tempDateFrom, setTempDateFrom] = useState(filters.dateFrom);
    const [tempDateTo, setTempDateTo] = useState(filters.dateTo);

    const filteredOrders = useMemo(() => {
        let filtered = [...DUMMY_ORDERS];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(order =>
                order.customer.name.toLowerCase().includes(q) ||
                order.customer.phone.toLowerCase().includes(q) ||
                order.orderNumber.toLowerCase().includes(q)
            );
        }
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(order => order.status === filters.status);
        }
        if (filters.dateFrom) {
            const from = new Date(filters.dateFrom); from.setHours(0, 0, 0, 0);
            filtered = filtered.filter(order => new Date(order.createdAt) >= from);
        }
        if (filters.dateTo) {
            const to = new Date(filters.dateTo); to.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order => new Date(order.createdAt) <= to);
        }

        return filtered;
    }, [filters]);

    // Stats
    const totalOrders = DUMMY_ORDERS.length;
    const completedOrders = DUMMY_ORDERS.filter(o => o.status === 'completed').length;
    const cancelledOrders = DUMMY_ORDERS.filter(o => o.status === 'cancelled').length;

    // Pagination
    const totalFiltered = filteredOrders.length;
    const totalPages = Math.ceil(totalFiltered / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const handleDateRangeApply = () => {
        updateFilter('dateFrom', tempDateFrom);
        updateFilter('dateTo', tempDateTo);
        setIsDateDialogOpen(false);
    };

    const handleDateRangeClear = () => {
        setTempDateFrom(''); setTempDateTo('');
        updateFilter('dateFrom', '');
        updateFilter('dateTo', '');
        setIsDateDialogOpen(false);
    };

    const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

    // Column definitions
    const columns = [
        {
            key: 'orderId',
            header: 'Order ID',
            headerClassName: 'min-w-25',
            cellClassName: 'font-mono text-xs font-medium',
            render: (order) => formatOrderId(order.orderNumber),
        },
        {
            key: 'customer',
            header: 'Customer',
            headerClassName: 'min-w-20',
            render: (order) => (
                <>
                    <div className="font-medium text-sm">{order.customer.name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                </>
            ),
        },
        {
            key: 'total',
            header: 'Total',
            headerClassName: 'min-w-25 text-right',
            cellClassName: 'text-right font-medium',
            render: (order) => `$${order.total.toFixed(2)}`,
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-40 text-center',
            cellClassName: 'text-center',
            render: (order) => getStatusBadge(order.status),
        },
        {
            key: 'createdAt',
            header: 'Created',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-xs text-center text-muted-foreground',
            render: (order) => formatDate(order.createdAt),
        },
    ];

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
                <StatsCard title="Total Orders" value={totalOrders} icon={ShoppingBag} caption="All orders" />
                <StatsCard
                    title="Completed Orders"
                    value={completedOrders}
                    icon={CheckCircle}
                    iconClassName="text-green-500"
                    valueClassName="text-green-500"
                    caption={`${Math.round((completedOrders / totalOrders) * 100)}% of total`}
                />
                <StatsCard
                    title="Cancelled Orders"
                    value={cancelledOrders}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption={`${Math.round((cancelledOrders / totalOrders) * 100)}% of total`}
                />
            </div>

            {/* Filters — Side by Side (original layout) */}
            <div className="flex flex-row gap-3">
                {/* Search */}
                <FilterSearchInput
                    placeholder="Search by customer name, phone or order ID..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="relative flex-1 max-w-140"
                />

                {/* Status Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1 min-w-35">
                            <Filter className="h-3.5 w-3.5" />
                            Status: {filters.status === 'all' ? 'All' : getStatusLabel(filters.status)}
                            <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                        </Button>
                    } />
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateFilter('status', 'all')}>All</DropdownMenuItem>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <DropdownMenuItem key={key} onClick={() => updateFilter('status', key)}>
                                    <config.icon className="mr-2 h-3.5 w-3.5" />{config.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Date Range Filter — md+ only, kept as-is */}
                <div className="hidden md:flex">
                    <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
                        <DialogTrigger render={
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1 min-w-35">
                                <Calendar className="h-3.5 w-3.5" />
                                {filters.dateFrom || filters.dateTo ? (
                                    <span className="text-primary">
                                        {filters.dateFrom && filters.dateTo
                                            ? `${new Date(filters.dateFrom).toLocaleDateString()} - ${new Date(filters.dateTo).toLocaleDateString()}`
                                            : filters.dateFrom
                                                ? `From ${new Date(filters.dateFrom).toLocaleDateString()}`
                                                : `To ${new Date(filters.dateTo).toLocaleDateString()}`}
                                    </span>
                                ) : 'Date Range'}
                                <ChevronDown className="h-3.5 w-3.5 ml-auto" />
                            </Button>
                        } />
                        <DialogContent className="sm:max-w-106.25">
                            <DialogHeader>
                                <DialogTitle>Date Range</DialogTitle>
                                <DialogDescription>Select a date range to filter orders.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">From</label>
                                    <Input type="date" value={tempDateFrom} onChange={(e) => setTempDateFrom(e.target.value)} className="h-10 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">To</label>
                                    <Input type="date" value={tempDateTo} onChange={(e) => setTempDateTo(e.target.value)} className="h-10 text-sm" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={handleDateRangeClear}>Clear</Button>
                                <Button onClick={handleDateRangeApply}>Apply</Button>
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
                            resetFilters(FILTER_DEFAULTS);
                            setTempDateFrom('');
                            setTempDateTo('');
                        }}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Table + Pagination — rows are clickable */}
            <DataTable
                columns={columns}
                data={paginatedOrders}
                getRowKey={(order) => order._id}
                emptyMessage="No orders found."
                tableMinWidth="min-w-225"
                onRowClick={(order) => router.push(`/orders/${order._id}`)}
                footer={
                    <PaginationFooter
                        page={filters.page}
                        totalPages={totalPages}
                        totalFiltered={totalFiltered}
                        startIndex={startIndex}
                        endIndex={endIndex}
                        onPageChange={(p) => updateFilter('page', p)}
                        getPageNums={getPageNums}
                    />
                }
            />
        </div>
    );
};

export default OrdersList;