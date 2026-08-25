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
import { formatCurrency } from '@/lib/formatters';

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    pending: { label: 'Pending', icon: Clock },
    confirmed: { label: 'Confirmed', icon: Check },
    preparing: { label: 'Preparing', icon: Clock },
    out_for_delivery: { label: 'Out for Delivery', icon: Package },
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

import { useOrders } from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const OrdersList = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData } = useOrders(filters);
    const ordersList = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };

    // Stats
    const totalOrders = pagination.total || ordersList.length;
    const completedOrders = ordersList.filter(o => o.status === 'completed').length;
    const cancelledOrders = ordersList.filter(o => o.status === 'cancelled').length;

    // Pagination
    const totalFiltered = totalOrders;
    const totalPages = pagination.totalPages || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = Math.min(startIndex + filters.limit, totalFiltered);
    const paginatedOrders = ordersList;

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
            render: (order) => formatCurrency(order.total),
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
                    iconClassName="text-chart-1"
                    valueClassName={"text-chart-1"}
                    caption="All orders"
                />
                <StatCard
                    title="Completed Orders"
                    value={completedOrders}
                    icon={CheckCircle}
                    iconClassName="text-chart-2"
                    valueClassName="text-chart-2"
                    caption={totalOrders > 0 ? `${Math.round((completedOrders / totalOrders) * 100)}% of total` : '0% of total'}
                />
                <StatCard
                    title="Cancelled Orders"
                    value={cancelledOrders}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption={totalOrders > 0 ? `${Math.round((cancelledOrders / totalOrders) * 100)}% of total` : '0% of total'}
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