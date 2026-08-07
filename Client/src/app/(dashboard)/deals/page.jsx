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
    ShoppingBag,
    Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy Data
const DUMMY_DEALS = [
    {
        _id: 'd1',
        name: 'Family Deal',
        description: '2 Large Pizzas + 4 Drinks + Garlic Bread',
        items: 5,
        price: 2499,
        isActive: true,
        orders: 425,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
    },
    {
        _id: 'd2',
        name: 'Pizza Combo',
        description: '1 Large Pizza + 2 Drinks + Cheese Sticks',
        items: 3,
        price: 1299,
        isActive: true,
        orders: 318,
        imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cd2a5e5e6a6?w=100&h=100&fit=crop',
    },
    {
        _id: 'd3',
        name: 'Chicken Bucket',
        description: '8 Pcs Chicken + 2 Large Fries + 2 Drinks',
        items: 4,
        price: 2999,
        isActive: false,
        orders: 97,
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop',
    },
    {
        _id: 'd4',
        name: 'Student Deal',
        description: '1 Pizza + 1 Drink + Fries',
        items: 3,
        price: 899,
        isActive: true,
        orders: 189,
        imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=100&h=100&fit=crop',
    },
    {
        _id: 'd5',
        name: 'Lunch Box',
        description: 'Burger + Fries + Drink',
        items: 3,
        price: 799,
        isActive: true,
        orders: 156,
        imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&h=100&fit=crop',
    },
    {
        _id: 'd6',
        name: 'Buy 1 Get 1',
        description: 'Buy 1 Large Pizza, Get 1 Free',
        items: 2,
        price: 1450,
        isActive: false,
        orders: 0,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop',
    },
    {
        _id: 'd7',
        name: 'Weekend Special',
        description: '2 Burgers + 2 Fries + 2 Drinks',
        items: 6,
        price: 1599,
        isActive: true,
        orders: 98,
        imageUrl: 'https://images.unsplash.com/photo-1551326844-4df70f78d0e9?w=100&h=100&fit=crop',
    },
    {
        _id: 'd8',
        name: 'Dinner for Two',
        description: '2 Main Courses + 2 Sides + 2 Drinks',
        items: 6,
        price: 2199,
        isActive: false,
        orders: 0,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=100&h=100&fit=crop',
    },
    {
        _id: 'd9',
        name: 'Mega Feast',
        description: '3 Pizzas + 6 Drinks + 3 Sides + Dessert',
        items: 13,
        price: 4999,
        isActive: true,
        orders: 45,
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop',
    },
    {
        _id: 'd10',
        name: 'Kids Meal',
        description: 'Mini Burger + Fries + Juice + Toy',
        items: 4,
        price: 449,
        isActive: true,
        orders: 78,
        imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=100&h=100&fit=crop',
    },
];

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

// Filter Components - Moved outside
const SearchInput = ({ value, onChange }) => (
    <div className="relative flex-1 min-w-37.5 sm:min-w-50">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
            placeholder="Search deals..."
            value={value}
            onChange={(e) => onChange('search', e.target.value)}
            className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
        />
    </div>
);

const StatusFilter = ({ value, onChange, className = "" }) => (
    <DropdownMenu>
        <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}>
                <Filter className="h-3.5 w-3.5" />
                Status: {STATUS_OPTIONS.find(s => s.value === value)?.label || 'All'}
                <ChevronDown className="h-3.5 w-3.5" />
            </Button>
        } />
        <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuGroup>
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => onChange('status', option.value)}>
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);

const SortFilter = ({ value, onChange, className = "" }) => (
    <DropdownMenu>
        <DropdownMenuTrigger render={
            <Button variant="outline" size="sm" className={cn("h-8 sm:h-9 text-xs sm:text-sm gap-1", className)}>
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort: {SORT_OPTIONS.find(s => s.value === value)?.label || 'Name'}
                <ChevronDown className="h-3.5 w-3.5" />
            </Button>
        } />
        <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuGroup>
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SORT_OPTIONS.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => onChange('sortBy', option.value)}>
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChange('order', 'asc')}>Ascending</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onChange('order', 'desc')}>Descending</DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
);

const ClearFiltersButton = ({
    hasActiveFilters,
    onClear,
    className = ""
}) => {
    if (!hasActiveFilters) return null;

    return (
        <Button
            variant="destructive"
            size="sm"
            className={cn("h-8 sm:h-9 text-xs sm:text-sm", className)}
            onClick={onClear}
        >
            Clear Filters
        </Button>
    );
};

const DealsList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const getFilterValue = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    const [searchParamsState, setSearchParamsState] = useState(() => ({
        page: parseInt(getFilterValue('page', '1')),
        limit: parseInt(getFilterValue('limit', '10')),
        search: getFilterValue('search', ''),
        status: getFilterValue('status', 'all'),
        sortBy: getFilterValue('sortBy', 'name'),
        order: getFilterValue('order', 'asc'),
    }));

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);

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

    useEffect(() => {
        updateURL(searchParamsState);
    }, [searchParamsState, updateURL]);

    const filteredDeals = useMemo(() => {
        let filtered = [...DUMMY_DEALS];

        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(deal =>
                deal.name.toLowerCase().includes(searchLower) ||
                deal.description.toLowerCase().includes(searchLower)
            );
        }

        if (searchParamsState.status !== 'all') {
            const isActive = searchParamsState.status === 'active';
            filtered = filtered.filter(deal => deal.isActive === isActive);
        }

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

    const totalDeals = DUMMY_DEALS.length;
    const activeDeals = DUMMY_DEALS.filter(deal => deal.isActive).length;
    const inactiveDeals = DUMMY_DEALS.filter(deal => !deal.isActive).length;
    const totalOrders = DUMMY_DEALS.reduce((sum, deal) => sum + deal.orders, 0);

    const totalFiltered = filteredDeals.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedDeals = filteredDeals.slice(startIndex, endIndex);

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

    const getPageNumbers = () => {
        const total = totalPages;
        const current = searchParamsState.page;
        const pages = [];
        const maxVisible = 5;

        if (total <= maxVisible) {
            for (let i = 1; i <= total; i++) pages.push(i);
        } else {
            pages.push(1);
            if (current > 3) pages.push('ellipsis');
            const start = Math.max(2, current - 1);
            const end = Math.min(total - 1, current + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (current < total - 2) pages.push('ellipsis');
            if (!pages.includes(total)) pages.push(total);
        }
        return pages;
    };

    const handleDelete = (deal) => {
        setSelectedDeal(deal);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        toast.success(`"${selectedDeal.name}" deleted successfully!`);
        setIsDeleteDialogOpen(false);
        setSelectedDeal(null);
    };

    const handleToggleActive = (deal) => {
        toast.success(`"${deal.name}" ${deal.isActive ? 'deactivated' : 'activated'} successfully!`);
    };

    const hasActiveFilters = searchParamsState.search ||
        searchParamsState.status !== 'all' ||
        searchParamsState.sortBy !== 'name' ||
        searchParamsState.order !== 'asc';

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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Deals</CardTitle>
                        <Gift className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalDeals}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All deals</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Active Deals</CardTitle>
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{activeDeals}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((activeDeals / totalDeals) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Inactive Deals</CardTitle>
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-destructive">{inactiveDeals}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Currently hidden</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{formatNumber(totalOrders)}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">From deals</p>
                    </CardContent>
                </Card>
            </div>

            {/* Mobile: horizontally scrollable filters */}
            <div className="md:hidden relative">
                <div className="overflow-x-auto scrollbar-thin pt-1 pb-2.5">
                    <div className="flex items-center gap-2 min-w-max">
                        <div className="relative min-w-[160px] w-[160px]">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search deals..."
                                value={searchParamsState.search}
                                onChange={(e) => updateFilter('search', e.target.value)}
                                className="pl-8 h-8 text-xs"
                            />
                        </div>
                        <StatusFilter
                            value={searchParamsState.status}
                            onChange={updateFilter}
                            className="h-8 text-xs"
                        />
                        <SortFilter
                            value={searchParamsState.sortBy}
                            onChange={updateFilter}
                            className="h-8 text-xs"
                        />
                        <ClearFiltersButton
                            hasActiveFilters={hasActiveFilters}
                            onClear={() => {
                                const newFilters = {
                                    page: 1,
                                    limit: 10,
                                    search: '',
                                    status: 'all',
                                    sortBy: 'name',
                                    order: 'asc',
                                };
                                setSearchParamsState(newFilters);
                            }}
                            className="h-8 text-xs whitespace-nowrap"
                        />
                    </div>
                </div>
            </div>

            {/* Desktop: original UI with flex wrap */}
            <div className="hidden md:flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <SearchInput value={searchParamsState.search} onChange={updateFilter} />
                <StatusFilter value={searchParamsState.status} onChange={updateFilter} />
                <SortFilter value={searchParamsState.sortBy} onChange={updateFilter} />
                <ClearFiltersButton
                    hasActiveFilters={hasActiveFilters}
                    onClear={() => {
                        const newFilters = {
                            page: 1,
                            limit: 10,
                            search: '',
                            status: 'all',
                            sortBy: 'name',
                            order: 'asc',
                        };
                        setSearchParamsState(newFilters);
                    }}
                />
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-[900px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Image</TableHead>
                                <TableHead className="min-w-[150px]">Deal Name</TableHead>
                                <TableHead className="min-w-[100px] text-center">Items</TableHead>
                                <TableHead className="min-w-[120px] text-right">Selling Price</TableHead>
                                <TableHead className="min-w-[100px] text-center">Status</TableHead>
                                <TableHead className="min-w-[100px] text-center">Orders</TableHead>
                                <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDeals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                        No deals found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedDeals.map((deal) => (
                                    <TableRow key={deal._id}>
                                        <TableCell>
                                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                                <Image
                                                    src={deal.imageUrl}
                                                    alt={deal.name}
                                                    fill
                                                    className="object-cover"
                                                    sizes="40px"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/deals/${deal._id}`}
                                                className="hover:text-primary transition-colors"
                                            >
                                                {deal.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {deal.items} Items
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatPrice(deal.price)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {deal.isActive ? (
                                                <Badge variant="default" className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="h-3 w-3" />
                                                    Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-muted-foreground">
                                            {formatNumber(deal.orders)}
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
                                                            <Link href={`/deals/${deal._id}`} className="cursor-pointer flex items-center">
                                                                <Edit className="mr-2 h-3.5 w-3.5" />
                                                                Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleActive(deal)}>
                                                            {deal.isActive ? (
                                                                <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" />
                                                            ) : (
                                                                <CheckCircle className="mr-2 h-3.5 w-3.5 text-primary" />
                                                            )}
                                                            {deal.isActive ? 'Mark Inactive' : 'Mark Active'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer text-destructive focus:text-destructive"
                                                            onClick={() => handleDelete(deal)}
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Deal</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete &quot;{selectedDeal?.name}&quot;? This action cannot be undone.
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

export default DealsList;