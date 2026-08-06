'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
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
    Users,
    UserPlus,
    MessageCircle,
    Search,
    Eye,
    MoreVertical,
    CheckCircle,
    XCircle,
    Calendar,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy Data
const DUMMY_CUSTOMERS = [
    {
        _id: 'c1',
        name: 'John Doe',
        phone: '+1 (555) 123-4567',
        telegramChatId: '123456789',
        orderCount: 12,
        createdAt: '2024-01-15T10:30:00Z',
    },
    {
        _id: 'c2',
        name: 'Jane Smith',
        phone: '+1 (555) 234-5678',
        telegramChatId: null,
        orderCount: 5,
        createdAt: '2024-01-14T14:20:00Z',
    },
    {
        _id: 'c3',
        name: 'Bob Johnson',
        phone: '+1 (555) 345-6789',
        telegramChatId: '987654321',
        orderCount: 8,
        createdAt: '2024-01-13T09:15:00Z',
    },
    {
        _id: 'c4',
        name: 'Sarah Williams',
        phone: '+1 (555) 456-7890',
        telegramChatId: null,
        orderCount: 3,
        createdAt: '2024-01-12T16:45:00Z',
    },
    {
        _id: 'c5',
        name: 'Mike Brown',
        phone: '+1 (555) 567-8901',
        telegramChatId: '456789123',
        orderCount: 15,
        createdAt: '2024-01-11T11:00:00Z',
    },
    {
        _id: 'c6',
        name: 'Emily Davis',
        phone: '+1 (555) 678-9012',
        telegramChatId: '789123456',
        orderCount: 6,
        createdAt: '2024-01-10T08:30:00Z',
    },
    {
        _id: 'c7',
        name: 'David Wilson',
        phone: '+1 (555) 789-0123',
        telegramChatId: null,
        orderCount: 2,
        createdAt: '2024-01-09T13:20:00Z',
    },
    {
        _id: 'c8',
        name: 'Lisa Anderson',
        phone: '+1 (555) 890-1234',
        telegramChatId: '321654987',
        orderCount: 9,
        createdAt: '2024-01-08T10:00:00Z',
    },
    {
        _id: 'c9',
        name: 'Tom Martinez',
        phone: '+1 (555) 901-2345',
        telegramChatId: null,
        orderCount: 4,
        createdAt: '2024-01-07T15:30:00Z',
    },
    {
        _id: 'c10',
        name: 'Rachel Taylor',
        phone: '+1 (555) 012-3456',
        telegramChatId: '654987321',
        orderCount: 7,
        createdAt: '2024-01-06T08:45:00Z',
    },
    {
        _id: 'c11',
        name: 'Chris Lee',
        phone: '+1 (555) 123-7890',
        telegramChatId: null,
        orderCount: 1,
        createdAt: '2024-01-05T14:10:00Z',
    },
    {
        _id: 'c12',
        name: 'Amanda White',
        phone: '+1 (555) 234-8901',
        telegramChatId: '159753486',
        orderCount: 11,
        createdAt: '2024-01-04T09:30:00Z',
    },
];

const CustomersList = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get filter values from URL query params
    const getFilterValue = useCallback((key, defaultValue) => {
        return searchParams.get(key) || defaultValue;
    }, [searchParams]);

    // Initialize state from URL
    const [searchParamsState, setSearchParamsState] = useState({
        page: parseInt(getFilterValue('page', '1')),
        limit: parseInt(getFilterValue('limit', '10')),
        search: getFilterValue('search', ''),
    });

    // Update URL when filters change
    const updateURL = useCallback((newFilters) => {
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value && value !== '') {
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
            if (value && value !== '') {
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

    // Memoized filtered customers
    const filteredCustomers = useMemo(() => {
        let filtered = [...DUMMY_CUSTOMERS];

        // Search filter (by name or phone)
        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(customer =>
                customer.name.toLowerCase().includes(searchLower) ||
                customer.phone.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [searchParamsState]);

    // Get stats
    const totalCustomers = DUMMY_CUSTOMERS.length;
    const telegramConnected = DUMMY_CUSTOMERS.filter(c => c.telegramChatId).length;
    const newThisMonth = DUMMY_CUSTOMERS.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() &&
            created.getFullYear() === now.getFullYear();
    }).length;

    // Pagination
    const totalFiltered = filteredCustomers.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Customers</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your customer base.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All customers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Connected via Telegram</CardTitle>
                        <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{telegramConnected}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {telegramConnected} of {totalCustomers} customers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">New This Month</CardTitle>
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-green-500">{newThisMonth}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((newThisMonth / totalCustomers) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative min-w-50">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or phone..."
                        value={searchParamsState.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8 h-8 sm:h-9 text-xs sm:text-sm w-70 lg:w-120"
                    />
                </div>

                {(searchParamsState.search) && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 sm:h-9 text-xs sm:text-sm"
                        onClick={() => {
                            const newFilters = {
                                page: 1,
                                limit: 10,
                                search: '',
                            };
                            setSearchParamsState(newFilters);
                        }}
                    >
                        Clear Search
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-175">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-45">Name</TableHead>
                                <TableHead className="min-w-37.5">Phone</TableHead>
                                <TableHead className="min-w-40 text-center">Telegram Connected</TableHead>
                                <TableHead className="min-w-25 text-center">Orders</TableHead>
                                <TableHead className="min-w-32.5">Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCustomers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                                        No customers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCustomers.map((customer) => (
                                    <TableRow
                                        key={customer._id}
                                        className="hover:bg-muted/50 transition-colors"
                                    // onClick={() => router.push(`/customers/${customer._id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            {customer.name}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {customer.phone}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {customer.telegramChatId ? (
                                                <Badge
                                                    variant="default"
                                                    className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                                >
                                                    <CheckCircle className="h-3 w-3" />
                                                    Connected
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] gap-1"
                                                >
                                                    <XCircle className="h-3 w-3" />
                                                    Not Connected
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">
                                            {customer.orderCount}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(customer.createdAt)}
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
        </div>
    );
};

export default CustomersList;