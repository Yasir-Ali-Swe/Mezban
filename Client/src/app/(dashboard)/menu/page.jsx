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
    Utensils,
    PackageOpen,
    AlertTriangle,
    Plus,
    ArrowUpDown,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle,
    Layers,
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
    category: 'all',
    availability: 'all',
    sortBy: 'name',
    order: 'asc',
};

const AVAILABILITY_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);

const fmtOrders = (num) => (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString());

import {
    useMenuItems,
    useMenuStats,
    useDeleteMenuItem,
    useUpdateMenuItem,
    useCategories,
} from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const MenuList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData } = useMenuItems(filters);
    const { data: statsResponse } = useMenuStats();
    const { data: categoriesData } = useCategories({ limit: 100 });
    const deleteMenuItemMutation = useDeleteMenuItem();
    const updateMenuItemMutation = useUpdateMenuItem();

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const menuItems = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };
    const categoriesList = (categoriesData?.data || []).map(c => c.name);

    // Stats from dedicated endpoint
    const statsData = statsResponse?.data || {};
    const totalItems = statsData.totalItems ?? pagination.total ?? menuItems.length;
    const availableItems = statsData.availableItems ?? menuItems.filter(item => item.isAvailable).length;
    const unavailableItems = statsData.unavailableItems ?? menuItems.filter(item => !item.isAvailable).length;
    const categoriesCount = statsData.categoriesCount ?? (categoriesList.length || 1);

    // Pagination
    const totalFiltered = totalItems;
    const totalPages = pagination.totalPages || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = Math.min(startIndex + filters.limit, totalFiltered);
    const paginatedItems = menuItems;

    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedItem) return;
        try {
            await deleteMenuItemMutation.mutateAsync(selectedItem._id || selectedItem.id);
            toast.success(`"${selectedItem.name}" deleted successfully!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete menu item');
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedItem(null);
        }
    };

    const handleToggleAvailability = async (item) => {
        try {
            await updateMenuItemMutation.mutateAsync({
                id: item._id || item.id,
                status: item.isAvailable ? 'unavailable' : 'available',
            });
            toast.success(`"${item.name}" marked as ${item.isAvailable ? 'unavailable' : 'available'} successfully!`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update item availability');
        }
    };

    const hasActiveFilters =
        filters.search || filters.category !== 'all' || filters.availability !== 'all' ||
        filters.sortBy !== 'name' || filters.order !== 'asc';

    // Sort dropdown groups
    const sortGroups = [
        {
            label: 'Sort By',
            options: [
                { value: 'name', label: 'Name' },
                { value: 'price', label: 'Price' },
                { value: 'orders', label: 'Orders' },
            ],
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

    const categoryOptions = useMemo(() => [
        { value: 'all', label: 'All' },
        ...((categoriesData?.data || []).map((c) => ({ value: c.name, label: c.name }))),
    ], [categoriesData]);

    // All filter controls as a reusable fragment
    const filterControls = (
        <>
            <FilterSearchInput
                placeholder="Search menu items..."
                value={filters.search}
                onChange={updateFilter}
                className="relative w-70 md:flex-1 md:max-w-120 shrink-0"
            />
            <FilterDropdown
                label={filters.category === 'all' ? 'Category' : filters.category}
                options={categoryOptions}
                onSelect={(v) => updateFilter('category', v)}
                menuLabel="Category"
            />
            <FilterDropdown
                label={AVAILABILITY_OPTIONS.find(a => a.value === filters.availability)?.label || 'Status'}
                icon={CheckCircle}
                options={AVAILABILITY_OPTIONS}
                onSelect={(v) => updateFilter('availability', v)}
                menuLabel="Status"
            />
            <FilterDropdown
                label={[...sortGroups[0].options].find(s => s.value === filters.sortBy)?.label || 'Sort'}
                icon={ArrowUpDown}
                groups={sortGroups}
            />
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 sm:h-9 text-xs sm:text-sm whitespace-nowrap shrink-0"
                    onClick={() => resetFilters(FILTER_DEFAULTS)}
                >
                    Clear Filters
                </Button>
            )}
        </>
    );

    // Column definitions
    const columns = [
        {
            key: 'image',
            header: 'Image',
            headerClassName: 'w-12',
            render: (item) => (
                <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Item Name',
            headerClassName: 'min-w-37.5',
            cellClassName: 'font-medium',
            render: (item) => (
                <Link href={`/menu/${item._id}`} className="hover:text-primary transition-colors">
                    {item.name}
                </Link>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            headerClassName: 'min-w-30',
            render: (item) => (
                <StatusBadge status="intent" label={item.category} />
            ),
        },
        {
            key: 'price',
            header: 'Selling Price',
            headerClassName: 'min-w-25 text-right',
            cellClassName: 'text-right font-medium',
            render: (item) => formatPrice(item.price),
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-center',
            render: (item) => (
                <StatusBadge
                    status={item.isAvailable ? 'available' : 'unavailable'}
                    showIcon
                />
            ),
        },
        {
            key: 'orders',
            header: 'Orders',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-center text-sm text-muted-foreground',
            render: (item) => fmtOrders(item.orders),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'min-w-25 text-right',
            cellClassName: 'text-right',
            render: (item) => (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Link href={`/menu/${item._id}`} className="cursor-pointer flex items-center">
                                    <Edit className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleAvailability(item)}>
                                {item.isAvailable
                                    ? <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                    : <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />}
                                {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => handleDelete(item)}
                            >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
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
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Menu</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your menu items.
                    </p>
                </div>
                <Button className="w-35 flex items-center justify-center md:w-auto">
                    <Link href="/menu/new" className="flex items-center">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Menu Item
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard title="Total Menu Items" value={totalItems} icon={Utensils} caption="All items" iconClassName="text-chart-1" />
                <StatCard
                    title="Available Items"
                    value={availableItems}
                    icon={PackageOpen}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={totalItems > 0 ? `${Math.round((availableItems / totalItems) * 100)}% of total` : '0% of total'}
                />
                <StatCard
                    title="Unavailable Items"
                    value={unavailableItems}
                    icon={AlertTriangle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="Not available"
                />
                <StatCard title="Categories" value={categoriesCount} icon={Layers} caption="Total categories" iconClassName="text-chart-4" />
            </div>

            {/* Filters */}
            <div className="space-y-2">
                {/* Mobile: horizontally scrollable */}
                <div className="md:hidden overflow-x-auto scrollbar-hide py-1.5">
                    <div className="flex items-center gap-2 w-max">
                        {filterControls}
                    </div>
                </div>

                {/* Desktop/laptop: full-width, wrapping */}
                <div className="hidden md:flex md:flex-wrap md:items-center md:gap-2 py-1.5 md:w-full">
                    {filterControls}
                </div>
            </div>

            {/* Table + Pagination */}
            <DataTable
                columns={columns}
                data={paginatedItems}
                getRowKey={(item) => item._id}
                emptyMessage="No menu items found."
                tableMinWidth="min-w-225"
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
                title="Delete Menu Item"
                description={`Are you sure you want to delete "${selectedItem?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
                contentClassName="sm:max-w-106.25"
            />
        </div>
    );
};

export default MenuList;
