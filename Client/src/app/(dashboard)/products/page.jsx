'use client';

import Image from 'next/image';
import { useMemo } from 'react';
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
    Package,
    PackageOpen,
    AlertTriangle,
    Plus,
    ArrowUpDown,
    Edit,
    MoreVertical,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    FilterSearchInput,
    FilterDropdown,
    FilterPriceRange,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_PRODUCTS = [
    { _id: '1', name: 'Wireless Bluetooth Headphones', sku: 'WBH-001', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop', sellingPrice: 79.99, quantity: 45, reorderThreshold: 10, isActive: true, category: { name: 'Electronics' }, createdAt: '2026-01-15T10:30:00Z' },
    { _id: '2', name: 'Premium Cotton T-Shirt', sku: 'PCT-002', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop', sellingPrice: 29.99, quantity: 8, reorderThreshold: 15, isActive: true, category: { name: 'Clothing' }, createdAt: '2026-01-14T14:20:00Z' },
    { _id: '3', name: 'Stainless Steel Water Bottle', sku: 'SSW-003', imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop', sellingPrice: 24.99, quantity: 0, reorderThreshold: 5, isActive: true, category: { name: 'Kitchen' }, createdAt: '2026-01-13T09:15:00Z' },
    { _id: '4', name: '4K Action Camera', sku: '4KAC-004', imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop', sellingPrice: 199.99, quantity: 3, reorderThreshold: 8, isActive: false, category: { name: 'Electronics' }, createdAt: '2026-01-12T16:45:00Z' },
    { _id: '5', name: 'Organic Green Tea', sku: 'OGT-005', imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=100&h=100&fit=crop', sellingPrice: 15.99, quantity: 25, reorderThreshold: 20, isActive: true, category: { name: 'Beverages' }, createdAt: '2026-01-11T11:00:00Z' },
    { _id: '6', name: 'Leather Wallet', sku: 'LW-006', imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=100&h=100&fit=crop', sellingPrice: 49.99, quantity: 12, reorderThreshold: 10, isActive: true, category: { name: 'Accessories' }, createdAt: '2026-01-10T08:30:00Z' },
    { _id: '7', name: 'Yoga Mat', sku: 'YM-007', imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=100&h=100&fit=crop', sellingPrice: 34.99, quantity: 2, reorderThreshold: 12, isActive: true, category: { name: 'Fitness' }, createdAt: '2026-01-09T13:20:00Z' },
    { _id: '8', name: 'Desk Lamp', sku: 'DL-008', imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=100&h=100&fit=crop', sellingPrice: 39.99, quantity: 30, reorderThreshold: 10, isActive: false, category: { name: 'Home Office' }, createdAt: '2026-01-08T10:00:00Z' },
    { _id: '9', name: 'Wireless Charging Pad', sku: 'WCP-009', imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=100&h=100&fit=crop', sellingPrice: 29.99, quantity: 18, reorderThreshold: 15, isActive: true, category: { name: 'Electronics' }, createdAt: '2026-01-07T15:45:00Z' },
    { _id: '10', name: 'Coffee Mug Set', sku: 'CMS-010', imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=100&h=100&fit=crop', sellingPrice: 19.99, quantity: 6, reorderThreshold: 10, isActive: true, category: { name: 'Kitchen' }, createdAt: '2026-01-06T09:30:00Z' },
];

const DUMMY_CATEGORIES = [
    { _id: '1', name: 'Electronics' },
    { _id: '2', name: 'Clothing' },
    { _id: '3', name: 'Kitchen' },
    { _id: '4', name: 'Beverages' },
    { _id: '5', name: 'Accessories' },
    { _id: '6', name: 'Fitness' },
    { _id: '7', name: 'Home Office' },
];

// ─── Filter Config ───────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'createdAt',
    order: 'desc',
};

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All' },
    ...DUMMY_CATEGORIES.map((c) => ({ value: c.name, label: c.name })),
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStockStatus = (quantity, reorderThreshold) => {
    if (quantity <= reorderThreshold && quantity > 0) return { label: 'Low Stock' };
    if (quantity === 0) return { label: 'Out of Stock' };
    return { label: 'In Stock' };
};

const capitalize = (v) => (v ? v.charAt(0).toUpperCase() + v.slice(1) : '');

// ─── Component ────────────────────────────────────────────────────────────────

const ProductsList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    // Filtered + sorted data
    const filteredProducts = useMemo(() => {
        let filtered = [...DUMMY_PRODUCTS];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
            );
        }
        if (filters.category !== 'all') {
            filtered = filtered.filter(p => p.category?.name === filters.category);
        }
        if (filters.minPrice) {
            filtered = filtered.filter(p => p.sellingPrice >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice) {
            filtered = filtered.filter(p => p.sellingPrice <= parseFloat(filters.maxPrice));
        }

        const { sortBy, order } = filters;
        filtered.sort((a, b) => {
            let aVal = a[sortBy], bVal = b[sortBy];
            if (sortBy === 'sellingPrice' || sortBy === 'quantity') {
                aVal = Number(aVal); bVal = Number(bVal);
            } else if (sortBy === 'createdAt') {
                aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime();
            } else {
                aVal = String(aVal).toLowerCase(); bVal = String(bVal).toLowerCase();
            }
            return order === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

        return filtered;
    }, [filters]);

    // Stats
    const totalProducts = DUMMY_PRODUCTS.length;
    const activeProducts = DUMMY_PRODUCTS.filter(p => p.isActive).length;
    const lowStockProducts = DUMMY_PRODUCTS.filter(p => p.quantity <= p.reorderThreshold && p.quantity > 0).length;

    // Pagination
    const totalFiltered = filteredProducts.length;
    const totalPages = Math.ceil(totalFiltered / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const handleToggleActive = (productId) => {
        console.log('Toggle active for product:', productId);
    };

    const hasActiveFilters =
        filters.search || filters.category !== 'all' ||
        filters.minPrice || filters.maxPrice ||
        filters.sortBy !== 'createdAt' || filters.order !== 'desc';

    // Sort dropdown groups
    const sortGroups = [
        {
            label: 'Sort By',
            options: [
                { value: 'name', label: 'Name' },
                { value: 'sellingPrice', label: 'Price' },
                { value: 'quantity', label: 'Stock' },
                { value: 'createdAt', label: 'Date' },
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

    // Column definitions
    const columns = [
        {
            key: 'image',
            header: 'Image',
            headerClassName: 'w-12 min-w-[50px]',
            render: (p) => (
                <div className="relative h-8 w-8 overflow-hidden rounded-md">
                    <Image src={p.imageUrl} alt={p.name} fill className="object-cover" sizes="32px" />
                </div>
            ),
        },
        {
            key: 'name',
            header: 'Name',
            headerClassName: 'min-w-[150px]',
            cellClassName: 'font-medium',
            render: (p) => p.name,
        },
        {
            key: 'sku',
            header: 'SKU',
            headerClassName: 'min-w-[120px]',
            cellClassName: 'text-xs text-muted-foreground',
            render: (p) => p.sku,
        },
        {
            key: 'category',
            header: 'Category',
            headerClassName: 'min-w-[120px]',
            render: (p) => (
                <StatusBadge status="intent" label={p.category?.name || 'N/A'} />
            ),
        },
        {
            key: 'quantity',
            header: 'Qty',
            headerClassName: 'min-w-[80px] text-center',
            cellClassName: 'text-center',
            render: (p) => {
                const { label } = getStockStatus(p.quantity, p.reorderThreshold);
                return (
                    <>
                        <span className={cn(
                            'text-sm font-medium',
                            p.quantity <= p.reorderThreshold && p.quantity > 0 && 'text-yellow-500',
                            p.quantity === 0 && 'text-destructive'
                        )}>
                            {p.quantity}
                        </span>
                        <div className="text-[10px] text-muted-foreground">{label}</div>
                    </>
                );
            },
        },
        {
            key: 'price',
            header: 'Price',
            headerClassName: 'min-w-[100px] text-right',
            cellClassName: 'text-right font-medium',
            render: (p) => `$${p.sellingPrice.toFixed(2)}`,
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-[100px]',
            render: (p) => (
                <StatusBadge status={p.isActive} />
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'min-w-[80px] text-right',
            cellClassName: 'text-right',
            render: (p) => (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Link href={`/products/${p._id}/edit`} className="cursor-pointer flex items-center">
                                    <Edit className="mr-2 h-3.5 w-3.5" />
                                    Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onSelect={() => handleToggleActive(p._id)}
                            >
                                {p.isActive
                                    ? <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                    : <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />}
                                {p.isActive ? 'Deactivate' : 'Activate'}
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
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your product catalog.
                    </p>
                </div>
                <Link href="/products/new" className="flex items-center">
                    <Button className="w-35 flex items-center justify-center md:w-auto cursor-pointer">
                        <Plus className="h-4 w-4" />
                        Add Product
                    </Button>
                </Link>

            </div>

            {/* Stats Cards - Using StatCard */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Total Products"
                    value={totalProducts}
                    icon={Package}
                    caption="All products"
                />
                <StatCard
                    title="Active Products"
                    value={activeProducts}
                    icon={PackageOpen}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={`${Math.round((activeProducts / totalProducts) * 100)}% of total`}
                />
                <StatCard
                    title="Low Stock Products"
                    value={lowStockProducts}
                    icon={AlertTriangle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="Need attention"
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                {/* Search — always visible */}
                <FilterSearchInput
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="flex-1 min-w-37.5 sm:min-w-50"
                />

                {/* Mobile (xs): no additional filters */}
                <div className="flex sm:hidden gap-2">
                    {/* No additional filters on mobile */}
                </div>

                {/* Tablet (sm): Category + Clear */}
                <div className="hidden sm:flex md:hidden gap-2 items-center flex-wrap">
                    <FilterDropdown
                        label={`Category: ${filters.category === 'all' ? 'All' : capitalize(filters.category)}`}
                        options={CATEGORY_OPTIONS}
                        onSelect={(v) => updateFilter('category', v)}
                        menuLabel="Category"
                    />
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

                {/* Desktop (md+): Category + Price Range + Sort + Clear */}
                <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3">
                    <FilterDropdown
                        label={`Category: ${filters.category === 'all' ? 'All' : capitalize(filters.category)}`}
                        options={CATEGORY_OPTIONS}
                        onSelect={(v) => updateFilter('category', v)}
                        menuLabel="Category"
                    />
                    <FilterPriceRange
                        minValue={filters.minPrice}
                        maxValue={filters.maxPrice}
                        onMinChange={(v) => updateFilter('minPrice', v)}
                        onMaxChange={(v) => updateFilter('maxPrice', v)}
                    />
                    <FilterDropdown
                        label={`Sort: ${filters.sortBy === 'createdAt' ? 'Date' : capitalize(filters.sortBy)}`}
                        icon={ArrowUpDown}
                        groups={sortGroups}
                    />
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
            </div>

            {/* Table + Pagination */}
            <DataTable
                columns={columns}
                data={paginatedProducts}
                getRowKey={(p) => p._id}
                emptyMessage="No products found."
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
        </div>
    );
};

export default ProductsList;