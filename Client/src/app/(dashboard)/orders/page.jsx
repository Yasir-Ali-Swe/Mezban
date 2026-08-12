'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    ShoppingBag,
    CheckCircle,
    XCircle,
    Clock,
    Check,
    Package,
} from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    FilterDateRange,
    DataTable,
    PaginationFooter,
    FilterDropdown,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

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
    pending: { label: 'Pending', icon: Clock },
    confirmed: { label: 'Confirmed', icon: Check },
    processing: { label: 'Processing', icon: Package },
    completed: { label: 'Completed', icon: CheckCircle },
    cancelled: { label: 'Cancelled', icon: XCircle },
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

// ─── Component ────────────────────────────────────────────────────────────────

const OrdersList = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

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

    const hasActiveFilters = filters.search || filters.status !== 'all' || filters.dateFrom || filters.dateTo;

    // Status options for FilterDropdown
    const statusOptions = [
        { value: 'all', label: 'All' },
        ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
            value: key,
            label: config.label,
            icon: config.icon,
        })),
    ];

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
            render: (order) => (
                <StatusBadge status={order.status} />
            ),
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
                <StatCard
                    title="Total Orders"
                    value={totalOrders}
                    icon={ShoppingBag}
                    caption="All orders"
                />
                <StatCard
                    title="Completed Orders"
                    value={completedOrders}
                    icon={CheckCircle}
                    iconClassName="text-green-500"
                    valueClassName="text-green-500"
                    caption={`${Math.round((completedOrders / totalOrders) * 100)}% of total`}
                />
                <StatCard
                    title="Cancelled Orders"
                    value={cancelledOrders}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption={`${Math.round((cancelledOrders / totalOrders) * 100)}% of total`}
                />
            </div>

            {/* Filters — Side by Side */}
            <div className="flex flex-row flex-wrap gap-3">
                {/* Search */}
                <FilterSearchInput
                    placeholder="Search by customer name, phone or order ID..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="relative flex-1 min-w-[160px] max-w-140"
                />

                {/* Status Dropdown - using FilterDropdown */}
                <FilterDropdown
                    label={`Status: ${getStatusLabel(filters.status)}`}
                    options={statusOptions}
                    onSelect={(v) => updateFilter('status', v)}
                    menuLabel="Status"
                    className="min-w-[120px]"
                />

                {/* Date Range Filter - using FilterDateRange */}
                <FilterDateRange
                    dateFrom={filters.dateFrom}
                    dateTo={filters.dateTo}
                    onApply={(from, to) => {
                        updateFilter('dateFrom', from);
                        updateFilter('dateTo', to);
                    }}
                    onClear={() => {
                        updateFilter('dateFrom', '');
                        updateFilter('dateTo', '');
                    }}
                />

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => resetFilters(FILTER_DEFAULTS)}
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