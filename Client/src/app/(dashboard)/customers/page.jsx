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

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_CUSTOMERS = [
    { _id: 'c1', name: 'John Doe', phone: '+1 (555) 123-4567', telegramChatId: '123456789', orderCount: 12, createdAt: '2024-01-15T10:30:00Z' },
    { _id: 'c2', name: 'Jane Smith', phone: '+1 (555) 234-5678', telegramChatId: null, orderCount: 5, createdAt: '2024-01-14T14:20:00Z' },
    { _id: 'c3', name: 'Bob Johnson', phone: '+1 (555) 345-6789', telegramChatId: '987654321', orderCount: 8, createdAt: '2024-01-13T09:15:00Z' },
    { _id: 'c4', name: 'Sarah Williams', phone: '+1 (555) 456-7890', telegramChatId: null, orderCount: 3, createdAt: '2024-01-12T16:45:00Z' },
    { _id: 'c5', name: 'Mike Brown', phone: '+1 (555) 567-8901', telegramChatId: '456789123', orderCount: 15, createdAt: '2024-01-11T11:00:00Z' },
    { _id: 'c6', name: 'Emily Davis', phone: '+1 (555) 678-9012', telegramChatId: '789123456', orderCount: 6, createdAt: '2024-01-10T08:30:00Z' },
    { _id: 'c7', name: 'David Wilson', phone: '+1 (555) 789-0123', telegramChatId: null, orderCount: 2, createdAt: '2024-01-09T13:20:00Z' },
    { _id: 'c8', name: 'Lisa Anderson', phone: '+1 (555) 890-1234', telegramChatId: '321654987', orderCount: 9, createdAt: '2024-01-08T10:00:00Z' },
    { _id: 'c9', name: 'Tom Martinez', phone: '+1 (555) 901-2345', telegramChatId: null, orderCount: 4, createdAt: '2024-01-07T15:30:00Z' },
    { _id: 'c10', name: 'Rachel Taylor', phone: '+1 (555) 012-3456', telegramChatId: '654987321', orderCount: 7, createdAt: '2024-01-06T08:45:00Z' },
    { _id: 'c11', name: 'Chris Lee', phone: '+1 (555) 123-7890', telegramChatId: null, orderCount: 1, createdAt: '2024-01-05T14:10:00Z' },
    { _id: 'c12', name: 'Amanda White', phone: '+1 (555) 234-8901', telegramChatId: '159753486', orderCount: 11, createdAt: '2024-01-04T09:30:00Z' },
];

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

import { useCustomers } from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const CustomersList = () => {
    const router = useRouter();
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData } = useCustomers(filters);
    const customersList = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };

    // Stats
    const totalCustomers = pagination.total || customersList.length;
    const telegramConnected = customersList.filter(c => c.telegramChatId).length;
    const now = new Date();
    const newThisMonth = customersList.filter(c => {
        const d = new Date(c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

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
                <StatCard title="Total Customers" value={totalCustomers} icon={Users} caption="All customers" />
                <StatCard
                    title="Connected via Telegram"
                    value={telegramConnected}
                    icon={MessageCircle}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={`${telegramConnected} of ${totalCustomers} customers`}
                />
                <StatCard
                    title="New This Month"
                    value={newThisMonth}
                    icon={TrendingUp}
                    iconClassName="text-green-500"
                    valueClassName="text-green-500"
                    caption={`${Math.round((newThisMonth / totalCustomers) * 100)}% of total`}
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