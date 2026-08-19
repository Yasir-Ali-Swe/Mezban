'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
    Users,
    UserPlus,
    MessageCircle,
    CheckCircle,
    XCircle,
    TrendingUp,
} from 'lucide-react';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

import { useCustomers, useCustomerStats } from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const CustomersList = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData } = useCustomers(filters);
    const { data: statsResponse } = useCustomerStats();

    const customersList = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };
    const statsData = statsResponse?.data || {};

    // Stats
    const totalCustomers = statsData.totalCustomers ?? (pagination.total || customersList.length);
    const telegramConnected = statsData.telegramConnected ?? customersList.filter(c => c.telegramChatId).length;
    const newThisMonth = statsData.newThisMonth ?? 0;

    // Pagination
    const totalFiltered = totalCustomers;
    const totalPages = pagination.totalPages || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = Math.min(startIndex + filters.limit, totalFiltered);
    const paginatedCustomers = customersList;

    // Column definitions
    const columns = [
        {
            key: 'name',
            header: 'Name',
            headerClassName: 'min-w-45',
            cellClassName: 'font-medium',
            render: (c) => c.name,
        },
        {
            key: 'phone',
            header: 'Phone',
            headerClassName: 'min-w-37.5',
            cellClassName: 'text-sm',
            render: (c) => c.phone,
        },
        {
            key: 'telegram',
            header: 'Telegram Connected',
            headerClassName: 'min-w-40 text-center',
            cellClassName: 'text-center',
            render: (c) => (
                <StatusBadge
                    status={c.telegramChatId ? 'connected' : 'disconnected'}
                    showIcon
                />
            ),
        },
        {
            key: 'orders',
            header: 'Orders',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-center font-medium',
            render: (c) => c.orderCount,
        },
        {
            key: 'joined',
            header: 'Joined',
            headerClassName: 'min-w-32.5',
            cellClassName: 'text-sm text-muted-foreground',
            render: (c) => formatDate(c.createdAt),
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customers</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your customer base.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
                <StatCard title="Total Customers" value={totalCustomers} icon={Users} caption="All customers" iconClassName="text-chart-2" />
                <StatCard
                    title="Connected via Telegram"
                    value={telegramConnected}
                    icon={MessageCircle}
                    iconClassName="text-chart-1"
                    valueClassName="text-primary"
                    caption={`${telegramConnected} of ${totalCustomers} customers`}
                />
                <StatCard
                    title="New This Month"
                    value={newThisMonth}
                    icon={TrendingUp}
                    iconClassName="text-green-500"
                    valueClassName="text-green-500"
                    caption={totalCustomers > 0 ? `${Math.round((newThisMonth / totalCustomers) * 100)}% of total` : '0% of total'}
                />
            </div>

            {/* Search — original layout: items-center gap-2 sm:gap-3 with ClearSearch on search active */}
            <div className="flex items-center gap-2 sm:gap-3">
                <FilterSearchInput
                    placeholder="Search by name or phone..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="relative min-w-50 w-70 lg:w-120"
                />
                {filters.search && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => resetFilters(FILTER_DEFAULTS)}
                    >
                        Clear Search
                    </Button>
                )}
            </div>

            {/* Table + Pagination — rows are clickable */}
            <DataTable
                columns={columns}
                data={paginatedCustomers}
                getRowKey={(c) => c._id}
                emptyMessage="No customers found."
                tableMinWidth="min-w-175"
                onRowClick={(c) => router.push(`/conversations/${c._id}`)}
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

export default CustomersList;