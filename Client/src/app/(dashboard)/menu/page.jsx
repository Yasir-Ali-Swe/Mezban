'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Utensils,
    PackageOpen,
    AlertTriangle,
    Plus,
    Search,
    Filter,
    ChevronDown,
    Edit,
    Trash2,
    MoreVertical,
    CheckCircle,
    XCircle,
    ArrowUpDown,
    Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy Data
const DUMMY_MENU_ITEMS = [
    {
        _id: 'm1',
        name: 'Zinger Burger',
        category: 'Burgers',
        price: 650,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 45,
        orders: 1245,
        createdAt: '2024-01-15T10:30:00Z',
    },
    {
        _id: 'm2',
        name: 'Chicken Pizza',
        category: 'Pizza',
        price: 1450,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 18,
        orders: 845,
        createdAt: '2024-01-14T14:20:00Z',
    },
    {
        _id: 'm3',
        name: 'Pepsi 500ml',
        category: 'Drinks',
        price: 120,
        imageUrl: 'https://images.unsplash.com/photo-1581010148125-6a8be79e9790?w=100&h=100&fit=crop',
        isAvailable: false,
        stock: 0,
        orders: 2410,
        createdAt: '2024-01-13T09:15:00Z',
    },
    {
        _id: 'm4',
        name: 'French Fries',
        category: 'Sides',
        price: 280,
        imageUrl: 'https://images.unsplash.com/photo-1585109406040-9d52f21a03d1?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 35,
        orders: 1032,
        createdAt: '2024-01-12T16:45:00Z',
    },
    {
        _id: 'm5',
        name: 'Chicken Wings',
        category: 'Appetizers',
        price: 780,
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 20,
        orders: 620,
        createdAt: '2024-01-11T11:00:00Z',
    },
    {
        _id: 'm6',
        name: 'Chicken Tikka',
        category: 'Main Course',
        price: 890,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 25,
        orders: 450,
        createdAt: '2024-01-10T08:30:00Z',
    },
    {
        _id: 'm7',
        name: 'Beef Burger',
        category: 'Burgers',
        price: 720,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop',
        isAvailable: false,
        stock: 0,
        orders: 890,
        createdAt: '2024-01-09T13:20:00Z',
    },
    {
        _id: 'm8',
        name: 'Cola 500ml',
        category: 'Drinks',
        price: 110,
        imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 30,
        orders: 1800,
        createdAt: '2024-01-08T10:00:00Z',
    },
    {
        _id: 'm9',
        name: 'Garlic Bread',
        category: 'Sides',
        price: 200,
        imageUrl: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 12,
        orders: 560,
        createdAt: '2024-01-07T15:30:00Z',
    },
    {
        _id: 'm10',
        name: 'Chicken Shawarma',
        category: 'Main Course',
        price: 550,
        imageUrl: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=100&h=100&fit=crop',
        isAvailable: false,
        stock: 0,
        orders: 740,
        createdAt: '2024-01-06T08:45:00Z',
    },
    {
        _id: 'm11',
        name: 'Mushroom Pizza',
        category: 'Pizza',
        price: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cd2a5e5e6a6?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 15,
        orders: 320,
        createdAt: '2024-01-05T14:10:00Z',
    },
    {
        _id: 'm12',
        name: 'Mango Juice',
        category: 'Drinks',
        price: 180,
        imageUrl: 'https://images.unsplash.com/photo-1546173159-3152d6d3c0d3?w=100&h=100&fit=crop',
        isAvailable: true,
        stock: 8,
        orders: 410,
        createdAt: '2024-01-04T09:30:00Z',
    },
];

const DUMMY_CATEGORIES = [
    'Burgers',
    'Pizza',
    'Drinks',
    'Sides',
    'Appetizers',
    'Main Course',
];

const AVAILABILITY_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'available', label: 'Available' },
    { value: 'unavailable', label: 'Unavailable' },
];

const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'orders', label: 'Orders' },
    { value: 'stock', label: 'Stock' },
];

const MenuList = () => {
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
        availability: getFilterValue('availability', 'all'),
        minPrice: getFilterValue('minPrice', ''),
        maxPrice: getFilterValue('maxPrice', ''),
        sortBy: getFilterValue('sortBy', 'name'),
        order: getFilterValue('order', 'asc'),
    }));

    // Dialog states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    // Update URL when filters change
    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== '' && value !== 'all') {
                params.set(key, value);
            }
        });
        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newUrl, { scroll: false });
    }, [router]);

    // Update filter
    const updateFilter = useCallback((key, value) => {
        setSearchParamsState(prev => {
            const newParams = { ...prev };
            if (value && value !== '' && value !== 'all') {
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

    // Memoized filtered menu items
    const filteredItems = useMemo(() => {
        let filtered = [...DUMMY_MENU_ITEMS];

        // Search filter
        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.category.toLowerCase().includes(searchLower)
            );
        }

        // Category filter
        if (searchParamsState.category !== 'all') {
            filtered = filtered.filter(item =>
                item.category === searchParamsState.category
            );
        }

        // Availability filter
        if (searchParamsState.availability !== 'all') {
            const isAvailable = searchParamsState.availability === 'available';
            filtered = filtered.filter(item =>
                item.isAvailable === isAvailable
            );
        }

        // Price filters
        if (searchParamsState.minPrice) {
            filtered = filtered.filter(item =>
                item.price >= parseFloat(searchParamsState.minPrice)
            );
        }
        if (searchParamsState.maxPrice) {
            filtered = filtered.filter(item =>
                item.price <= parseFloat(searchParamsState.maxPrice)
            );
        }

        // Sorting
        const sortBy = searchParamsState.sortBy;
        const order = searchParamsState.order;
        filtered.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (order === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        return filtered;
    }, [searchParamsState]);

    // Get stats
    const totalItems = DUMMY_MENU_ITEMS.length;
    const availableItems = DUMMY_MENU_ITEMS.filter(item => item.isAvailable).length;
    const unavailableItems = DUMMY_MENU_ITEMS.filter(item => !item.isAvailable).length;
    const categoriesCount = DUMMY_CATEGORIES.length;

    // Pagination
    const totalFiltered = filteredItems.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedItems = filteredItems.slice(startIndex, endIndex);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatNumber = (num) => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Menu Items</CardTitle>
                        <Utensils className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalItems}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All items</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Available Items</CardTitle>
                        <PackageOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{availableItems}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((availableItems / totalItems) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Unavailable Items</CardTitle>
                        <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-destructive">{unavailableItems}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Not available</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Categories</CardTitle>
                        <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{categoriesCount}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Total categories</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative flex-1 min-w-37.5 sm:min-w-50">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search menu items..."
                        value={searchParamsState.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                    />
                </div>

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
                                <DropdownMenuItem key={cat} onClick={() => updateFilter('category', cat)}>
                                    {cat}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm gap-1">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Status: {AVAILABILITY_OPTIONS.find(a => a.value === searchParamsState.availability)?.label || 'All'}
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    } />
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {AVAILABILITY_OPTIONS.map((option) => (
                                <DropdownMenuItem key={option.value} onClick={() => updateFilter('availability', option.value)}>
                                    {option.label}
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
                            Sort: {SORT_OPTIONS.find(s => s.value === searchParamsState.sortBy)?.label || 'Name'}
                            <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                    } />
                    <DropdownMenuContent align="start" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {SORT_OPTIONS.map((option) => (
                                <DropdownMenuItem key={option.value} onClick={() => updateFilter('sortBy', option.value)}>
                                    {option.label}
                                </DropdownMenuItem>
                            ))}
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
                    searchParamsState.availability !== 'all' ||
                    searchParamsState.minPrice || searchParamsState.maxPrice ||
                    searchParamsState.sortBy !== 'name' || searchParamsState.order !== 'asc') && (
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
                                    availability: 'all',
                                    minPrice: '',
                                    maxPrice: '',
                                    sortBy: 'name',
                                    order: 'asc',
                                };
                                setSearchParamsState(newFilters);
                            }}
                        >
                            Clear Filters
                        </Button>
                    )}
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-225">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Image</TableHead>
                                <TableHead className="min-w-37.5">Item Name</TableHead>
                                <TableHead className="min-w-30">Category</TableHead>
                                <TableHead className="min-w-25 text-right">Selling Price</TableHead>
                                <TableHead className="min-w-25 text-center">Status</TableHead>
                                <TableHead className="min-w-25 text-center">Orders</TableHead>
                                <TableHead className="min-w-20 text-center">Stock</TableHead>
                                <TableHead className="min-w-25 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                                        No menu items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedItems.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell>
                                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                                <Image
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/menu/${item._id}`}
                                                className="hover:text-primary transition-colors"
                                            >
                                                {item.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(item.price)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {item.isAvailable ? (
                                                <Badge variant="default" className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Available
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    Unavailable
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {formatNumber(item.orders)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={cn(
                                                "text-sm font-medium",
                                                item.stock === 0 && "text-destructive"
                                            )}>
                                                {item.stock}
                                            </span>
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
                                                            <Link href={`/menu/${item._id}`} className="cursor-pointer flex items-center">
                                                                <Edit className="mr-2 h-3.5 w-3.5" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleAvailability(item)}>
                                                            {item.isAvailable ? (
                                                                <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                                            ) : (
                                                                <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />
                                                            )}
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
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {/* Footer */}
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-106.25">
                    <DialogHeader>
                        <DialogTitle>Delete Menu Item</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{selectedItem?.name}&quot;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MenuList;