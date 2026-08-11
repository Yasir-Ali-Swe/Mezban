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
    StatsCard,
    FilterSearchInput,
    FilterDropdown,
    FilterPriceRange,
    DataTable,
    PaginationFooter,
    ConfirmDialog,
} from '@/components/shared/dashboard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_MENU_ITEMS = [
    { _id: 'm1', name: 'Zinger Burger', category: 'Burgers', price: 650, imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop', isAvailable: true, stock: 45, orders: 1245, createdAt: '2024-01-15T10:30:00Z' },
    { _id: 'm2', name: 'Chicken Pizza', category: 'Pizza', price: 1450, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop', isAvailable: true, stock: 18, orders: 845, createdAt: '2024-01-14T14:20:00Z' },
    { _id: 'm3', name: 'Pepsi 500ml', category: 'Drinks', price: 120, imageUrl: 'https://images.unsplash.com/photo-1581010148125-6a8be79e9790?w=100&h=100&fit=crop', isAvailable: false, stock: 0, orders: 2410, createdAt: '2024-01-13T09:15:00Z' },
    { _id: 'm4', name: 'French Fries', category: 'Sides', price: 280, imageUrl: 'https://images.unsplash.com/photo-1585109406040-9d52f21a03d1?w=100&h=100&fit=crop', isAvailable: true, stock: 35, orders: 1032, createdAt: '2024-01-12T16:45:00Z' },
    { _id: 'm5', name: 'Chicken Wings', category: 'Appetizers', price: 780, imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop', isAvailable: true, stock: 20, orders: 620, createdAt: '2024-01-11T11:00:00Z' },
    { _id: 'm6', name: 'Chicken Tikka', category: 'Main Course', price: 890, imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&h=100&fit=crop', isAvailable: true, stock: 25, orders: 450, createdAt: '2024-01-10T08:30:00Z' },
    { _id: 'm7', name: 'Beef Burger', category: 'Burgers', price: 720, imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop', isAvailable: false, stock: 0, orders: 890, createdAt: '2024-01-09T13:20:00Z' },
    { _id: 'm8', name: 'Cola 500ml', category: 'Drinks', price: 110, imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100&h=100&fit=crop', isAvailable: true, stock: 30, orders: 1800, createdAt: '2024-01-08T10:00:00Z' },
    { _id: 'm9', name: 'Garlic Bread', category: 'Sides', price: 200, imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=100&h=100&fit=crop', isAvailable: true, stock: 12, orders: 560, createdAt: '2024-01-07T15:30:00Z' },
    { _id: 'm10', name: 'Chicken Shawarma', category: 'Main Course', price: 550, imageUrl: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=100&h=100&fit=crop', isAvailable: false, stock: 0, orders: 740, createdAt: '2024-01-06T08:45:00Z' },
    { _id: 'm11', name: 'Mushroom Pizza', category: 'Pizza', price: 1200, imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cd2a5e5e6a6?w=100&h=100&fit=crop', isAvailable: true, stock: 15, orders: 320, createdAt: '2024-01-05T14:10:00Z' },
    { _id: 'm12', name: 'Mango Juice', category: 'Drinks', price: 180, imageUrl: 'https://images.unsplash.com/photo-1546173159-3152d6d3c0d3?w=100&h=100&fit=crop', isAvailable: true, stock: 8, orders: 410, createdAt: '2024-01-04T09:30:00Z' },
];

const DUMMY_CATEGORIES = ['Burgers', 'Pizza', 'Drinks', 'Sides', 'Appetizers', 'Main Course'];

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    category: 'all',
    availability: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
    order: 'asc',
};

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All' },
    ...DUMMY_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const AVAILABILITY_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(price);

const fmtOrders = (num) => (num >= 1000 ? (num / 1000).toFixed(1) + 'k' : num.toString());

// ─── Component ────────────────────────────────────────────────────────────────

const MenuList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Filtered + sorted data
    const filteredItems = useMemo(() => {
        let filtered = [...DUMMY_MENU_ITEMS];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
            );
        }
        if (filters.category !== 'all') {
            filtered = filtered.filter(item => item.category === filters.category);
        }
        if (filters.availability !== 'all') {
            const isAvailable = filters.availability === 'available';
            filtered = filtered.filter(item => item.isAvailable === isAvailable);
        }
        if (filters.minPrice) {
            filtered = filtered.filter(item => item.price >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(item => item.price <= parseFloat(filters.maxPrice));
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
    const totalItems = DUMMY_MENU_ITEMS.length;
    const availableItems = DUMMY_MENU_ITEMS.filter(item => item.isAvailable).length;
    const unavailableItems = DUMMY_MENU_ITEMS.filter(item => !item.isAvailable).length;
    const categoriesCount = DUMMY_CATEGORIES.length;

    // Pagination
    const totalFiltered = filteredItems.length;
    const totalPages = Math.ceil(totalFiltered / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        toast.success(`"${selectedItem.name}" deleted successfully!`);
        setIsDeleteDialogOpen(false);
        setSelectedItem(null);
    };

    const handleToggleAvailability = (item) => {
        toast.success(`"${item.name}" marked as ${item.isAvailable ? 'unavailable' : 'available'} successfully!`);
    };

    const hasActiveFilters =
        filters.search || filters.category !== 'all' || filters.availability !== 'all' ||
        filters.minPrice || filters.maxPrice || filters.sortBy !== 'name' || filters.order !== 'asc';

    // Sort dropdown groups
    const sortGroups = [
        {
            label: 'Sort By',
            options: [
                { value: 'name', label: 'Name' },
                { value: 'price', label: 'Price' },
                { value: 'orders', label: 'Orders' },
                { value: 'stock', label: 'Stock' },
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
                options={CATEGORY_OPTIONS}
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
            <FilterPriceRange
                minValue={filters.minPrice}
                maxValue={filters.maxPrice}
                onMinChange={(v) => updateFilter('minPrice', v)}
                onMaxChange={(v) => updateFilter('maxPrice', v)}
                minPlaceholder="Min"
                maxPlaceholder="Max"
                inputClassName="w-16 md:w-20"
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
                <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
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
            render: (item) => item.isAvailable ? (
                <Badge variant="default" className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Available
                </Badge>
            ) : (
                <Badge variant="secondary" className="text-[10px] gap-1">
                    <XCircle className="h-3 w-3" />
                    Unavailable
                </Badge>
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
            key: 'stock',
            header: 'Stock',
            headerClassName: 'min-w-20 text-center',
            cellClassName: 'text-center',
            render: (item) => (
                <span className={cn('text-sm font-medium', item.stock === 0 && 'text-destructive')}>
                    {item.stock}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'min-w-25 text-right',
            cellClassName: 'text-right',
            render: (item) => (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
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
                <StatsCard title="Total Menu Items" value={totalItems} icon={Utensils} caption="All items" />
                <StatsCard
                    title="Available Items"
                    value={availableItems}
                    icon={PackageOpen}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={`${Math.round((availableItems / totalItems) * 100)}% of total`}
                />
                <StatsCard
                    title="Unavailable Items"
                    value={unavailableItems}
                    icon={AlertTriangle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="Not available"
                />
                <StatsCard title="Categories" value={categoriesCount} icon={Layers} caption="Total categories" />
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