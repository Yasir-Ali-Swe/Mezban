'use client';

import Image from 'next/image';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
    StatsCard,
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
    ConfirmDialog,
} from '@/components/shared/dashboard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_DEALS = [
    { _id: 'd1', name: 'Family Deal', description: '2 Large Pizzas + 4 Drinks + Garlic Bread', items: 5, price: 2499, isActive: true, orders: 425, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop' },
    { _id: 'd2', name: 'Pizza Combo', description: '1 Large Pizza + 2 Drinks + Cheese Sticks', items: 3, price: 1299, isActive: true, orders: 318, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cd2a5e5e6a6?w=100&h=100&fit=crop' },
    { _id: 'd3', name: 'Chicken Bucket', description: '8 Pcs Chicken + 2 Large Fries + 2 Drinks', items: 4, price: 2999, isActive: false, orders: 97, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop' },
    { _id: 'd4', name: 'Student Deal', description: '1 Pizza + 1 Drink + Fries', items: 3, price: 899, isActive: true, orders: 189, imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=100&h=100&fit=crop' },
    { _id: 'd5', name: 'Lunch Box', description: 'Burger + Fries + Drink', items: 3, price: 799, isActive: true, orders: 156, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop' },
    { _id: 'd6', name: 'Buy 1 Get 1', description: 'Buy 1 Large Pizza, Get 1 Free', items: 2, price: 1450, isActive: false, orders: 0, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop' },
    { _id: 'd7', name: 'Weekend Special', description: '2 Burgers + 2 Fries + 2 Drinks', items: 6, price: 1599, isActive: true, orders: 98, imageUrl: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=100&h=100&fit=crop' },
    { _id: 'd8', name: 'Dinner for Two', description: '2 Main Courses + 2 Sides + 2 Drinks', items: 6, price: 2199, isActive: false, orders: 0, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&h=100&fit=crop' },
    { _id: 'd9', name: 'Mega Feast', description: '3 Pizzas + 6 Drinks + 3 Sides + Dessert', items: 13, price: 4999, isActive: true, orders: 45, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop' },
    { _id: 'd10', name: 'Kids Meal', description: 'Mini Burger + Fries + Juice + Toy', items: 4, price: 449, isActive: true, orders: 78, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop' },
];

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

// ─── Component ────────────────────────────────────────────────────────────────

const DealsList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);

    // Filtered + sorted data
    const filteredDeals = useMemo(() => {
        let filtered = [...DUMMY_DEALS];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(deal =>
                deal.name.toLowerCase().includes(q) || deal.description.toLowerCase().includes(q)
            );
        }
        if (filters.status !== 'all') {
            const isActive = filters.status === 'active';
            filtered = filtered.filter(deal => deal.isActive === isActive);
        }

        const { sortBy, order } = filters;
        filtered.sort((a, b) => {
            let aVal = a[sortBy], bVal = b[sortBy];
            if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
            return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

        return filtered;
    }, [filters]);

    // Stats
    const totalDeals = DUMMY_DEALS.length;
    const activeDeals = DUMMY_DEALS.filter(d => d.isActive).length;
    const inactiveDeals = DUMMY_DEALS.filter(d => !d.isActive).length;
    const totalOrders = DUMMY_DEALS.reduce((sum, d) => sum + d.orders, 0);

    // Pagination
    const totalFiltered = filteredDeals.length;
    const totalPages = Math.ceil(totalFiltered / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

    const handleDelete = (deal) => { setSelectedDeal(deal); setIsDeleteDialogOpen(true); };

    const confirmDelete = () => {
        toast.success(`"${selectedDeal.name}" deleted successfully!`);
        setIsDeleteDialogOpen(false);
        setSelectedDeal(null);
    };

    const handleToggleActive = (deal) => {
        toast.success(`"${deal.name}" ${deal.isActive ? 'deactivated' : 'activated'} successfully!`);
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
            render: (deal) => deal.isActive ? (
                <Badge variant="default" className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />Active
                </Badge>
            ) : (
                <Badge variant="secondary" className="text-[10px] gap-1">
                    <XCircle className="h-3 w-3" />Inactive
                </Badge>
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
                <StatsCard title="Total Deals" value={totalDeals} icon={Gift} caption="All deals" />
                <StatsCard
                    title="Active Deals"
                    value={activeDeals}
                    icon={CheckCircle}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={`${Math.round((activeDeals / totalDeals) * 100)}% of total`}
                />
                <StatsCard
                    title="Inactive Deals"
                    value={inactiveDeals}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="Currently hidden"
                />
                <StatsCard title="Total Orders" value={fmtNum(totalOrders)} icon={ShoppingBag} caption="From deals" />
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