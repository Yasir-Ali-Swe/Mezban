'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
    Package,
    PackageOpen,
    AlertTriangle,
    Search,
    Filter,
    ChevronDown,
    Eye,
    Edit,
    MoreVertical,
    CheckCircle,
    XCircle,
    Plus,
    ArrowUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy Data
const DUMMY_PRODUCTS = [
    {
        _id: '1',
        name: 'Wireless Bluetooth Headphones',
        sku: 'WBH-001',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
        sellingPrice: 79.99,
        quantity: 45,
        reorderThreshold: 10,
        isActive: true,
        category: { name: 'Electronics' },
        createdAt: '2026-01-15T10:30:00Z',
    },
    {
        _id: '2',
        name: 'Premium Cotton T-Shirt',
        sku: 'PCT-002',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
        sellingPrice: 29.99,
        quantity: 8,
        reorderThreshold: 15,
        isActive: true,
        category: { name: 'Clothing' },
        createdAt: '2026-01-14T14:20:00Z',
    },
    {
        _id: '3',
        name: 'Stainless Steel Water Bottle',
        sku: 'SSW-003',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop',
        sellingPrice: 24.99,
        quantity: 0,
        reorderThreshold: 5,
        isActive: true,
        category: { name: 'Kitchen' },
        createdAt: '2026-01-13T09:15:00Z',
    },
    {
        _id: '4',
        name: '4K Action Camera',
        sku: '4KAC-004',
        imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=100&h=100&fit=crop',
        sellingPrice: 199.99,
        quantity: 3,
        reorderThreshold: 8,
        isActive: false,
        category: { name: 'Electronics' },
        createdAt: '2026-01-12T16:45:00Z',
    },
    {
        _id: '5',
        name: 'Organic Green Tea',
        sku: 'OGT-005',
        imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=100&h=100&fit=crop',
        sellingPrice: 15.99,
        quantity: 25,
        reorderThreshold: 20,
        isActive: true,
        category: { name: 'Beverages' },
        createdAt: '2026-01-11T11:00:00Z',
    },
    {
        _id: '6',
        name: 'Leather Wallet',
        sku: 'LW-006',
        imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=100&h=100&fit=crop',
        sellingPrice: 49.99,
        quantity: 12,
        reorderThreshold: 10,
        isActive: true,
        category: { name: 'Accessories' },
        createdAt: '2026-01-10T08:30:00Z',
    },
    {
        _id: '7',
        name: 'Yoga Mat',
        sku: 'YM-007',
        imageUrl: 'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=100&h=100&fit=crop',
        sellingPrice: 34.99,
        quantity: 2,
        reorderThreshold: 12,
        isActive: true,
        category: { name: 'Fitness' },
        createdAt: '2026-01-09T13:20:00Z',
    },
    {
        _id: '8',
        name: 'Desk Lamp',
        sku: 'DL-008',
        imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=100&h=100&fit=crop',
        sellingPrice: 39.99,
        quantity: 30,
        reorderThreshold: 10,
        isActive: false,
        category: { name: 'Home Office' },
        createdAt: '2026-01-08T10:00:00Z',
    },
    {
        _id: '9',
        name: 'Wireless Charging Pad',
        sku: 'WCP-009',
        imageUrl: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=100&h=100&fit=crop',
        sellingPrice: 29.99,
        quantity: 18,
        reorderThreshold: 15,
        isActive: true,
        category: { name: 'Electronics' },
        createdAt: '2026-01-07T15:45:00Z',
    },
    {
        _id: '10',
        name: 'Coffee Mug Set',
        sku: 'CMS-010',
        imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=100&h=100&fit=crop',
        sellingPrice: 19.99,
        quantity: 6,
        reorderThreshold: 10,
        isActive: true,
        category: { name: 'Kitchen' },
        createdAt: '2026-01-06T09:30:00Z',
    },
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

const ProductsList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get filter values from URL query params
    const getFilterValue = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    // Initialize state from URL
    const [searchParamsState, setSearchParamsState] = useState(() => ({
        page: parseInt(getFilterValue('page', '1')),
        limit: parseInt(getFilterValue('limit', '10')),
        search: getFilterValue('search', ''),
        category: getFilterValue('category', 'all'),
        minPrice: getFilterValue('minPrice', ''),
        maxPrice: getFilterValue('maxPrice', ''),
        sortBy: getFilterValue('sortBy', 'createdAt'),
        order: getFilterValue('order', 'desc'),
    }));

    // Update URL when filters change
    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                params.set(key, value);
            }
        });
        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
    }, [router]);

    // Update filter - this is the main function that handles filter changes
    const updateFilter = useCallback((key, value) => {
        setSearchParamsState(prev => {
            const newParams = { ...prev };
            if (value && value !== 'all' && value !== '') {
                newParams[key] = value;
            } else {
                newParams[key] = key === 'page' ? 1 : '';
                if (key !== 'page') {
                    newParams.page = 1;
                }
            }
            if (key !== 'page') {
                newParams.page = 1;
            }
            return newParams;
        });
    }, []);

    // Effect to update URL when state changes
    useEffect(() => {
        updateURL(searchParamsState);
    }, [searchParamsState, updateURL]);

    // Memoized filtered products to avoid recalculating on every render
    const filteredProducts = useMemo(() => {
        let filtered = [...DUMMY_PRODUCTS];

        // Search filter
        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.sku.toLowerCase().includes(searchLower)
            );
        }

        // Category filter
        if (searchParamsState.category !== 'all') {
            filtered = filtered.filter(p =>
                p.category?.name === searchParamsState.category
            );
        }

        // Price filters
        if (searchParamsState.minPrice) {
            filtered = filtered.filter(p =>
                p.sellingPrice >= parseFloat(searchParamsState.minPrice)
            );
        }
        if (searchParamsState.maxPrice) {
            filtered = filtered.filter(p =>
                p.sellingPrice <= parseFloat(searchParamsState.maxPrice)
            );
        }

        // Sorting
        const sortBy = searchParamsState.sortBy;
        const order = searchParamsState.order;
        filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === 'sellingPrice' || sortBy === 'quantity') {
                aVal = Number(aVal);
                bVal = Number(bVal);
            } else if (sortBy === 'createdAt') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [searchParamsState]);

    // Get stats from dummy data
    const totalProducts = DUMMY_PRODUCTS.length;
    const activeProducts = DUMMY_PRODUCTS.filter(p => p.isActive).length;
    const lowStockProducts = DUMMY_PRODUCTS.filter(p => p.quantity <= p.reorderThreshold && p.quantity > 0).length;

    // Pagination
    const totalFiltered = filteredProducts.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const handleToggleActive = (productId) => {
        console.log('Toggle active for product:', productId);
    };

    const getStatusBadge = (isActive) => {
        return isActive ? 'default' : 'destructive';
    };

    const getStockStatus = (quantity, reorderThreshold) => {
        if (quantity <= reorderThreshold && quantity > 0) {
            return { label: 'Low Stock', className: 'text-yellow-500 border-yellow-500/30' };
        }
        if (quantity === 0) {
            return { label: 'Out of Stock', className: 'text-destructive border-destructive/30' };
        }
        return { label: 'In Stock', className: 'text-green-500 border-green-500/30' };
    };

    const capitalize = (value) => {
        if (!value) return '';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const getPageNumbers = () => {
        const total = totalPages;
        const current = searchParamsState.page;
        const pages = [];
        const maxVisible = 5;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (current > 3) {
                pages.push('ellipsis');
            }
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
            if (current < total - 2) {
                pages.push('ellipsis');
            }
            if (!pages.includes(total)) {
                pages.push(total);
            }
        }
        return pages;
    };

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
                <Button className="w-35 flex items-center justify-center md:w-auto">
                    <Link href="/products/new" className="flex items-center">
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Product
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalProducts}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All products</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Active Products</CardTitle>
                        <PackageOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{activeProducts}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((activeProducts / totalProducts) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Low Stock Products</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-destructive">{lowStockProducts}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Need attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                {/* Search - Always visible */}
                <div className="relative flex-1 min-w-37.5 sm:min-w-50">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search products..."
                        value={searchParamsState.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                    />
                </div>

                {/* Mobile (xs): Only search input - nothing else */}
                <div className="flex sm:hidden gap-2">
                    {/* No additional filters on mobile */}
                </div>

                {/* Tablet (sm): Search + Category Dropdown + Clear */}
                <div className="hidden sm:flex md:hidden gap-2 items-center flex-wrap">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                Category: {searchParamsState.category === 'all' ? 'All' : capitalize(searchParamsState.category)}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Category</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateFilter('category', 'all')}>
                                    All
                                </DropdownMenuItem>
                                {DUMMY_CATEGORIES.map((cat) => (
                                    <DropdownMenuItem key={cat._id} onClick={() => updateFilter('category', cat.name)}>
                                        {cat.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchParamsState.search || searchParamsState.category !== 'all' ||
                        searchParamsState.minPrice || searchParamsState.maxPrice ||
                        searchParamsState.sortBy !== 'createdAt' || searchParamsState.order !== 'desc') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 sm:h-9 text-xs sm:text-sm"
                                onClick={() => {
                                    const newFilters = {
                                        page: 1,
                                        limit: 10,
                                        search: '',
                                        category: 'all',
                                        minPrice: '',
                                        maxPrice: '',
                                        sortBy: 'createdAt',
                                        order: 'desc',
                                    };
                                    setSearchParamsState(newFilters);
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                </div>

                {/* Desktop (md+): All filters */}
                <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                Category: {searchParamsState.category === 'all' ? 'All' : capitalize(searchParamsState.category)}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Category</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateFilter('category', 'all')}>
                                    All
                                </DropdownMenuItem>
                                {DUMMY_CATEGORIES.map((cat) => (
                                    <DropdownMenuItem key={cat._id} onClick={() => updateFilter('category', cat.name)}>
                                        {cat.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            placeholder="Min Price"
                            value={searchParamsState.minPrice}
                            onChange={(e) => updateFilter('minPrice', e.target.value)}
                            className="h-8 sm:h-9 text-xs sm:text-sm w-24 sm:w-28"
                        />
                        <span className="text-xs text-muted-foreground">-</span>
                        <Input
                            type="number"
                            placeholder="Max Price"
                            value={searchParamsState.maxPrice}
                            onChange={(e) => updateFilter('maxPrice', e.target.value)}
                            className="h-8 sm:h-9 text-xs sm:text-sm w-24 sm:w-28"
                        />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger render={
                            <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1">
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                Sort: {searchParamsState.sortBy === 'createdAt' ? 'Date' : capitalize(searchParamsState.sortBy)}
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        } />
                        <DropdownMenuContent align="start" className="w-40">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateFilter('sortBy', 'name')}>
                                    Name
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('sortBy', 'sellingPrice')}>
                                    Price
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('sortBy', 'quantity')}>
                                    Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('sortBy', 'createdAt')}>
                                    Date
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Order</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateFilter('order', 'asc')}>
                                    Ascending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateFilter('order', 'desc')}>
                                    Descending
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {(searchParamsState.search || searchParamsState.category !== 'all' ||
                        searchParamsState.minPrice || searchParamsState.maxPrice ||
                        searchParamsState.sortBy !== 'createdAt' || searchParamsState.order !== 'desc') && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 sm:h-9 text-xs sm:text-sm"
                                onClick={() => {
                                    const newFilters = {
                                        page: 1,
                                        limit: 10,
                                        search: '',
                                        category: 'all',
                                        minPrice: '',
                                        maxPrice: '',
                                        sortBy: 'createdAt',
                                        order: 'desc',
                                    };
                                    setSearchParamsState(newFilters);
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                </div>
            </div>

            {/* Table - Horizontally scrollable with hidden scrollbar on large screens */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 min-w-[50px]">Image</TableHead>
                                <TableHead className="min-w-[150px]">Name</TableHead>
                                <TableHead className="min-w-[120px]">SKU</TableHead>
                                <TableHead className="min-w-[120px]">Category</TableHead>
                                <TableHead className="min-w-[80px] text-center">Qty</TableHead>
                                <TableHead className="min-w-[100px] text-right">Price</TableHead>
                                <TableHead className="min-w-[100px]">Status</TableHead>
                                <TableHead className="min-w-[80px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedProducts.map((product) => {
                                    const stockStatus = getStockStatus(product.quantity, product.reorderThreshold);
                                    return (
                                        <TableRow key={product._id}>
                                            <TableCell>
                                                <div className="relative h-8 w-8 overflow-hidden rounded-md">
                                                    <Image
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        fill
                                                        className="object-cover"
                                                        sizes="32px"
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {product.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {product.sku}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {product.category?.name || 'N/A'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    product.quantity <= product.reorderThreshold && product.quantity > 0 && "text-yellow-500",
                                                    product.quantity === 0 && "text-destructive"
                                                )}>
                                                    {product.quantity}
                                                </span>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {stockStatus.label}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                ${product.sellingPrice.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadge(product.isActive)} className="text-[10px]">
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger render={
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                        </Button>
                                                    } />
                                                    <DropdownMenuContent align="end" className="w-40">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuItem>
                                                                <Link href={`/products/${product._id}/edit`} className="cursor-pointer flex items-center">
                                                                    <Edit className="mr-2 h-3.5 w-3.5" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onSelect={() => handleToggleActive(product._id)}
                                                            >
                                                                {product.isActive ? (
                                                                    <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                                                ) : (
                                                                    <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />
                                                                )}
                                                                {product.isActive ? 'Deactivate' : 'Activate'}
                                                            </DropdownMenuItem>
                                                        </DropdownMenuGroup>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Footer: count + pagination */}
                <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
                    <div className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                        Showing <span className="font-medium">{totalFiltered === 0 ? 0 : startIndex + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(endIndex, totalFiltered)}</span>{' '}
                        of <span className="font-medium">{totalFiltered}</span> results
                    </div>

                    <Pagination className="mx-0 w-auto">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (searchParamsState.page > 1) updateFilter('page', searchParamsState.page - 1);
                                    }}
                                    className={cn(
                                        'h-8 sm:h-9 text-xs sm:text-sm',
                                        searchParamsState.page <= 1 && 'pointer-events-none opacity-50'
                                    )}
                                />
                            </PaginationItem>

                            {getPageNumbers().map((p, index) => (
                                <PaginationItem key={index}>
                                    {p === 'ellipsis' ? (
                                        <PaginationEllipsis className="h-8 sm:h-9" />
                                    ) : (
                                        <PaginationLink
                                            href="#"
                                            isActive={p === searchParamsState.page}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                updateFilter('page', p);
                                            }}
                                            className="h-8 sm:h-9 min-w-8 sm:min-w-9 text-xs sm:text-sm"
                                        >
                                            {p}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (searchParamsState.page < totalPages) updateFilter('page', searchParamsState.page + 1);
                                    }}
                                    className={cn(
                                        'h-8 sm:h-9 text-xs sm:text-sm',
                                        searchParamsState.page >= totalPages && 'pointer-events-none opacity-50'
                                    )}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    );
};

export default ProductsList;