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
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tags,
    Package,
    Plus,
    Search,
    Eye,
    Edit,
    CircleX,
    MoreVertical,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy Data
const DUMMY_CATEGORIES = [
    {
        _id: 'c1',
        name: 'Electronics',
        categorySlug: 'electronics',
        createdBy: { name: 'John Doe', role: 'admin' },
        createdAt: '2024-01-15T10:30:00Z',
        productsCount: 45,
        isActive: true,
    },
    {
        _id: 'c2',
        name: 'Cables',
        categorySlug: 'cables',
        createdBy: { name: 'Jane Smith', role: 'manager' },
        createdAt: '2024-01-14T14:20:00Z',
        productsCount: 23,
        isActive: true,
    },
    {
        _id: 'c3',
        name: 'Accessories',
        categorySlug: 'accessories',
        createdBy: { name: 'John Doe', role: 'admin' },
        createdAt: '2024-01-13T09:15:00Z',
        productsCount: 12,
        isActive: true,
    },
    {
        _id: 'c4',
        name: 'Furniture',
        categorySlug: 'furniture',
        createdBy: { name: 'Sarah Johnson', role: 'manager' },
        createdAt: '2024-01-12T16:45:00Z',
        productsCount: 0,
        isActive: false,
    },
    {
        _id: 'c5',
        name: 'Stationery',
        categorySlug: 'stationery',
        createdBy: { name: 'Mike Wilson', role: 'staff' },
        createdAt: '2024-01-11T11:00:00Z',
        productsCount: 8,
        isActive: true,
    },
    {
        _id: 'c6',
        name: 'Kitchenware',
        categorySlug: 'kitchenware',
        createdBy: { name: 'Emma Davis', role: 'admin' },
        createdAt: '2024-01-10T08:30:00Z',
        productsCount: 15,
        isActive: true,
    },
    {
        _id: 'c7',
        name: 'Books',
        categorySlug: 'books',
        createdBy: { name: 'John Doe', role: 'admin' },
        createdAt: '2024-01-09T13:20:00Z',
        productsCount: 3,
        isActive: true,
    },
    {
        _id: 'c8',
        name: 'Toys',
        categorySlug: 'toys',
        createdBy: { name: 'Jane Smith', role: 'manager' },
        createdAt: '2024-01-08T10:00:00Z',
        productsCount: 0,
        isActive: false,
    },
];

const CategoriesList = () => {
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

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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

    // Memoized filtered categories
    const filteredCategories = useMemo(() => {
        let filtered = [...DUMMY_CATEGORIES];

        // Search filter
        if (searchParamsState.search) {
            const searchLower = searchParamsState.search.toLowerCase();
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(searchLower) ||
                cat.categorySlug.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [searchParamsState]);

    // Get stats
    const totalCategories = DUMMY_CATEGORIES.length;
    const activeCategories = DUMMY_CATEGORIES.filter(c => c.isActive).length;
    const inactiveCategories = DUMMY_CATEGORIES.filter(c => !c.isActive).length;

    // Pagination
    const totalFiltered = filteredCategories.length;
    const totalPages = Math.ceil(totalFiltered / searchParamsState.limit);
    const startIndex = (searchParamsState.page - 1) * searchParamsState.limit;
    const endIndex = startIndex + searchParamsState.limit;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

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

    // Generate slug from name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Handle add category
    const handleAddCategory = () => {
        setEditingCategory(null);
        setCategoryName('');
        setIsDialogOpen(true);
    };

    // Handle edit category
    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setCategoryName(category.name);
        setIsDialogOpen(true);
    };

    // Handle save category
    const handleSaveCategory = () => {
        if (!categoryName.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            const slug = generateSlug(categoryName);

            if (editingCategory) {
                // Edit existing category
                const categoryIndex = DUMMY_CATEGORIES.findIndex(c => c._id === editingCategory._id);
                if (categoryIndex !== -1) {
                    DUMMY_CATEGORIES[categoryIndex] = {
                        ...DUMMY_CATEGORIES[categoryIndex],
                        name: categoryName,
                        categorySlug: slug,
                    };
                }
                toast.success(`Category "${categoryName}" updated successfully!`);
            } else {
                // Add new category
                const newCategory = {
                    _id: `c${Date.now()}`,
                    name: categoryName,
                    categorySlug: slug,
                    createdBy: { name: 'Current User', role: 'admin' },
                    createdAt: new Date().toISOString(),
                    productsCount: 0,
                    isActive: true,
                };
                DUMMY_CATEGORIES.push(newCategory);
                toast.success(`Category "${categoryName}" created successfully!`);
            }

            setIsLoading(false);
            setIsDialogOpen(false);
            setCategoryName('');
            setEditingCategory(null);

            // Force re-render by updating state
            setSearchParamsState(prev => ({ ...prev }));
        }, 1000);
    };

    // Handle delete (deactivate) category
    const handleDelete = (category) => {
        if (category.productsCount > 0) {
            toast.error(`Cannot delete "${category.name}". ${category.productsCount} product(s) are associated with this category.`);
            return;
        }
        if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            toast.success(`Category "${category.name}" deleted successfully!`);
        }
    };

    // Handle deactivate category
    const handleDeactivate = (category) => {
        const categoryIndex = DUMMY_CATEGORIES.findIndex(c => c._id === category._id);
        if (categoryIndex !== -1) {
            DUMMY_CATEGORIES[categoryIndex].isActive = !DUMMY_CATEGORIES[categoryIndex].isActive;
            toast.success(`Category "${category.name}" ${DUMMY_CATEGORIES[categoryIndex].isActive ? 'activated' : 'deactivated'} successfully!`);
            setSearchParamsState(prev => ({ ...prev }));
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your product categories.
                    </p>
                </div>
                <Button
                    className="w-35 flex items-center justify-center md:w-auto"
                    onClick={handleAddCategory}
                >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Total Categories</CardTitle>
                        <Tags className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold">{totalCategories}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">All categories</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Active Categories</CardTitle>
                        <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-primary">{activeCategories}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {Math.round((activeCategories / totalCategories) * 100)}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium">Inactive Categories</CardTitle>
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg sm:text-2xl font-bold text-destructive">{inactiveCategories}</div>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">No products assigned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="relative flex-1 min-w-37.5 sm:min-w-50">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search categories..."
                        value={searchParamsState.search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        className="pl-8 h-8 sm:h-9 text-xs sm:text-sm w-full lg:w-120"
                    />
                </div>

                {(searchParamsState.search) && (
                    <Button
                        variant="ghost"
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

            {/* Table - Horizontally scrollable with hidden scrollbar on large screens */}
            <div className="border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="min-w-[150px]">Category Name</TableHead>
                                <TableHead className="min-w-[120px]">Slug</TableHead>
                                <TableHead className="min-w-[100px] text-center">Products</TableHead>
                                <TableHead className="min-w-[100px] text-center">Status</TableHead>
                                <TableHead className="min-w-[150px]">Created By</TableHead>
                                <TableHead className="min-w-[130px]">Created</TableHead>
                                <TableHead className="min-w-[100px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                                        No categories found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedCategories.map((category) => (
                                    <TableRow key={category._id}>
                                        <TableCell className="font-medium">
                                            {category.name}
                                            <div className="sm:hidden text-[10px] text-muted-foreground">
                                                {category.categorySlug}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {category.categorySlug}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Package className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-sm font-medium">{category.productsCount}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={category.isActive ? 'default' : 'destructive'}
                                                className="text-[10px]"
                                            >
                                                {category.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {category.createdBy?.name || 'N/A'}
                                            <div className="text-[10px] text-muted-foreground">
                                                {category.createdBy?.role || ''}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {formatDate(category.createdAt)}
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
                                                        <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                                                            <Edit className="mr-2 h-3.5 w-3.5" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="cursor-pointer"
                                                            onClick={() => handleDeactivate(category)}
                                                            variant={category.isActive ? 'destructive' : 'default'}
                                                        >
                                                            <CircleX className="mr-2 h-3.5 w-3.5" />
                                                            {category.isActive ? 'Deactivate' : 'Activate'}
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

            {/* Add/Edit Category Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingCategory ? 'Edit Category' : 'Add New Category'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingCategory
                                ? 'Update the category name below.'
                                : 'Enter the category name to create a new category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="categoryName" className="text-sm font-medium">
                                Category Name
                            </label>
                            <Input
                                id="categoryName"
                                placeholder="Enter category name..."
                                value={categoryName}
                                onChange={(e) => setCategoryName(e.target.value)}
                                className="h-10 text-sm mt-3"
                                autoFocus
                            />
                        </div>

                        {/* Slug Preview - View Mode */}
                        {categoryName && (
                            <div className="bg-muted p-3 rounded-md">
                                <p className="text-xs text-muted-foreground">Slug Preview</p>
                                <p className="text-sm font-medium text-primary">
                                    {generateSlug(categoryName)}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDialogOpen(false);
                                setCategoryName('');
                                setEditingCategory(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            disabled={!categoryName.trim() || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {editingCategory ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                editingCategory ? 'Update Category' : 'Add Category'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CategoriesList;