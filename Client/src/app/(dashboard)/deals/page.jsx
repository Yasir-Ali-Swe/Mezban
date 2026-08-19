'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle,
    ArrowUpDown,
    ShoppingBag,
    Gift,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
    ConfirmDialog,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
    sortBy: 'name',
    order: 'asc',
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'orders', label: 'Orders' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);

const fmtNum = (num) => (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString());

import { useDeals, useDealStats, useDeleteDeal, useUpdateDeal } from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const DealsList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData } = useDeals(filters);
    const { data: statsResponse } = useDealStats();
    const deleteDealMutation = useDeleteDeal();
    const updateDealMutation = useUpdateDeal();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);

    const dealsList = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };

    // Stats from dedicated endpoint
    const statsData = statsResponse?.data || {};
    const totalDeals = statsData.totalDeals ?? pagination.total ?? dealsList.length;
    const activeDeals = statsData.activeDeals ?? dealsList.filter(d => d.isActive).length;
    const inactiveDeals = statsData.inactiveDeals ?? dealsList.filter(d => !d.isActive).length;
    const totalOrders = statsData.totalOrders ?? dealsList.reduce((sum, d) => sum + (d.orders || 0), 0);

    // Pagination
    const totalFiltered = totalDeals;
    const totalPages = pagination.totalPages || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = Math.min(startIndex + filters.limit, totalFiltered);
    const paginatedDeals = dealsList;

    const handleDelete = (deal) => { setSelectedDeal(deal); setIsDeleteDialogOpen(true); };

    const confirmDelete = async () => {
        if (!selectedDeal) return;
        try {
            await deleteDealMutation.mutateAsync(selectedDeal._id || selectedDeal.id);
            toast.success(`"${selectedDeal.name}" deleted successfully!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete deal');
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedDeal(null);
        }
    };

    const handleToggleActive = async (deal) => {
        try {
            await updateDealMutation.mutateAsync({
                id: deal._id || deal.id,
                status: deal.isActive ? 'inactive' : 'active',
            });
            toast.success(`"${deal.name}" ${deal.isActive ? 'deactivated' : 'activated'} successfully!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update deal status');
        }
    };

    const hasActiveFilters =
        filters.search || filters.status !== 'all' ||
        filters.sortBy !== 'name' || filters.order !== 'asc';

    // Sort groups
    const sortGroups = [
        {
            label: 'Sort By',
            options: SORT_OPTIONS,
            onSelect: (v) => updateFilter('sortBy', v),
        },
        {
            label: 'Order',
            options: [
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' },
            ],
            onSelect: (v) => updateFilter('order', v),
        },
    ];

    // Column definitions
    const columns = [
        {
            key: 'image',
            header: 'Image',
            headerClassName: 'w-12',
            render: (deal) => (
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image src={deal.imageUrl} alt={deal.name} fill className="object-cover" sizes="40px" />
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Deal Name',
            headerClassName: 'min-w-[150px]',
            cellClassName: 'font-medium',
            render: (deal) => (
                <Link href={`/deals/${deal._id}`} className="hover:text-primary transition-colors">
                    {deal.name}
                </Link>
            ),
        },
        {
            key: 'items',
            header: 'Items',
            headerClassName: 'min-w-[100px] text-center',
            cellClassName: 'text-center text-sm text-muted-foreground',
            render: (deal) => `${deal.items} Items`,
        },
        {
            key: 'price',
            header: 'Selling Price',
            headerClassName: 'min-w-[120px] text-right',
            cellClassName: 'text-right font-medium',
            render: (deal) => formatPrice(deal.price),
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-[100px] text-center',
            cellClassName: 'text-center',
            render: (deal) => (
                <StatusBadge status={deal.isActive} showIcon />
            ),
        },
        {
            key: 'orders',
            header: 'Orders',
            headerClassName: 'min-w-[100px] text-center',
            cellClassName: 'text-center text-sm text-muted-foreground',
            render: (deal) => fmtNum(deal.orders),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'min-w-[100px] text-right',
            cellClassName: 'text-right',
            render: (deal) => (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Link href={`/deals/${deal._id}`} className="cursor-pointer flex items-center">
                                    <Edit className="mr-2 h-3.5 w-3.5" />Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleActive(deal)}>
                                {deal.isActive
                                    ? <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                    : <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />}
                                {deal.isActive ? 'Mark Inactive' : 'Mark Active'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => handleDelete(deal)}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Deals</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your deals and combo offers.
                    </p>
                </div>
                <Button className="w-35 flex items-center justify-center md:w-auto">
                    <Link href="/deals/new" className="flex items-center">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Deal
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Deals" value={totalDeals} icon={Gift} caption="All deals" iconClassName="text-chart-2" />
                <StatCard
                    title="Active Deals"
                    value={activeDeals}
                    icon={CheckCircle}
                    iconClassName="text-chart-1"
                    valueClassName="text-chart-1"
                    caption={totalDeals > 0 ? `${Math.round((activeDeals / totalDeals) * 100)}% of total` : '0% of total'}
                />
                <StatCard
                    title="Inactive Deals"
                    value={inactiveDeals}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="Currently hidden"
                />
                <StatCard title="Total Orders" value={fmtNum(totalOrders)} icon={ShoppingBag} caption="From deals" iconClassName="text-chart-4" />
            </div>

            {/* Mobile: horizontally scrollable filters */}
            <div className="md:hidden relative">
                <div className="overflow-x-auto scrollbar-thin pt-1 pb-2.5">
                    <div className="flex items-center gap-2 min-w-max">
                        <FilterSearchInput
                            placeholder="Search deals..."
                            value={filters.search}
                            onChange={updateFilter}
                            className="relative min-w-[160px] w-[160px]"
                            inputClassName="h-8 text-xs"
                        />
                        <FilterDropdown
                            label={`Status: ${STATUS_OPTIONS.find(s => s.value === filters.status)?.label || 'All'}`}
                            options={STATUS_OPTIONS}
                            onSelect={(v) => updateFilter('status', v)}
                            menuLabel="Status"
                            className="h-8 text-xs"
                        />
                        <FilterDropdown
                            label={`Sort: ${SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label || 'Name'}`}
                            icon={ArrowUpDown}
                            groups={sortGroups}
                            className="h-8 text-xs"
                        />
                        {hasActiveFilters && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => resetFilters(FILTER_DEFAULTS)}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop: flex wrap */}
            <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <FilterSearchInput
                    placeholder="Search deals..."
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
                    label={`Sort: ${SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label || 'Name'}`}
                    icon={ArrowUpDown}
                    groups={sortGroups}
                />
                {hasActiveFilters && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => resetFilters(FILTER_DEFAULTS)}
                    >
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Table + Pagination */}
            <DataTable
                columns={columns}
                data={paginatedDeals}
                getRowKey={(d) => d._id}
                emptyMessage="No deals found."
                tableMinWidth="min-w-[900px]"
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

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                title="Delete Deal"
                description={`Are you sure you want to delete "${selectedDeal?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                contentClassName="sm:max-w-[425px]"
            />
        </div>
    );
};

export default DealsList;