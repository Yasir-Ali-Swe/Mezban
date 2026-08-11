'use client';

import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tags,
    Package,
    Plus,
    Edit,
    CircleX,
    MoreVertical,
    CheckCircle,
    XCircle,
    Loader2,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import {
    StatsCard,
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
} from '@/components/shared/dashboard';

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_CATEGORIES = [
    { _id: 'c1', name: 'Electronics', categorySlug: 'electronics', createdBy: { name: 'John Doe', role: 'admin' }, createdAt: '2024-01-15T10:30:00Z', productsCount: 45, isActive: true },
    { _id: 'c2', name: 'Cables', categorySlug: 'cables', createdBy: { name: 'Jane Smith', role: 'manager' }, createdAt: '2024-01-14T14:20:00Z', productsCount: 23, isActive: true },
    { _id: 'c3', name: 'Accessories', categorySlug: 'accessories', createdBy: { name: 'John Doe', role: 'admin' }, createdAt: '2024-01-13T09:15:00Z', productsCount: 12, isActive: true },
    { _id: 'c4', name: 'Furniture', categorySlug: 'furniture', createdBy: { name: 'Sarah Johnson', role: 'manager' }, createdAt: '2024-01-12T16:45:00Z', productsCount: 0, isActive: false },
    { _id: 'c5', name: 'Stationery', categorySlug: 'stationery', createdBy: { name: 'Mike Wilson', role: 'staff' }, createdAt: '2024-01-11T11:00:00Z', productsCount: 8, isActive: true },
    { _id: 'c6', name: 'Kitchenware', categorySlug: 'kitchenware', createdBy: { name: 'Emma Davis', role: 'admin' }, createdAt: '2024-01-10T08:30:00Z', productsCount: 15, isActive: true },
    { _id: 'c7', name: 'Books', categorySlug: 'books', createdBy: { name: 'John Doe', role: 'admin' }, createdAt: '2024-01-09T13:20:00Z', productsCount: 3, isActive: true },
    { _id: 'c8', name: 'Toys', categorySlug: 'toys', createdBy: { name: 'Jane Smith', role: 'manager' }, createdAt: '2024-01-08T10:00:00Z', productsCount: 0, isActive: false },
];

// ─── Filter Config ────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
    page: 1,
    limit: 10,
    search: '',
    status: 'all',
};

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active', icon: CheckCircle },
    { value: 'inactive', label: 'Inactive', icon: XCircle },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const getStatusLabel = (status) => {
    if (status === 'all') return 'All';
    if (status === 'active') return 'Active';
    if (status === 'inactive') return 'Inactive';
    return 'All';
};

// ─── Component ────────────────────────────────────────────────────────────────

const CategoriesList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    // Dialog states (Add/Edit — NOT a ConfirmDialog, it's a form dialog)
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Filtered data
    const filteredCategories = useMemo(() => {
        let filtered = [...DUMMY_CATEGORIES];

        if (filters.search) {
            const q = filters.search.toLowerCase();
            filtered = filtered.filter(cat =>
                cat.name.toLowerCase().includes(q) || cat.categorySlug.toLowerCase().includes(q)
            );
        }
        if (filters.status !== 'all') {
            const isActive = filters.status === 'active';
            filtered = filtered.filter(cat => cat.isActive === isActive);
        }

        return filtered;
    }, [filters]);

    // Stats
    const totalCategories = DUMMY_CATEGORIES.length;
    const activeCategories = DUMMY_CATEGORIES.filter(c => c.isActive).length;
    const inactiveCategories = DUMMY_CATEGORIES.filter(c => !c.isActive).length;

    // Pagination
    const totalFiltered = filteredCategories.length;
    const totalPages = Math.ceil(totalFiltered / filters.limit);
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = startIndex + filters.limit;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    const handleAddCategory = () => { setEditingCategory(null); setCategoryName(''); setIsDialogOpen(true); };
    const handleEditCategory = (category) => { setEditingCategory(category); setCategoryName(category.name); setIsDialogOpen(true); };

    const handleSaveCategory = () => {
        if (!categoryName.trim()) {
            toast.add({ type: 'error', title: 'Error!', description: 'Category name is required' });
            return;
        }
        setIsLoading(true);
        setTimeout(() => {
            const slug = generateSlug(categoryName);
            if (editingCategory) {
                const idx = DUMMY_CATEGORIES.findIndex(c => c._id === editingCategory._id);
                if (idx !== -1) { DUMMY_CATEGORIES[idx] = { ...DUMMY_CATEGORIES[idx], name: categoryName, categorySlug: slug }; }
                toast.add({ type: 'success', title: 'Success!', description: `Category "${categoryName}" updated successfully!` });
            } else {
                DUMMY_CATEGORIES.push({ _id: `c${Date.now()}`, name: categoryName, categorySlug: slug, createdBy: { name: 'Current User', role: 'admin' }, createdAt: new Date().toISOString(), productsCount: 0, isActive: true });
                toast.add({ type: 'success', title: 'Success!', description: `Category "${categoryName}" created successfully!` });
            }
            setIsLoading(false);
            setIsDialogOpen(false);
            setCategoryName('');
            setEditingCategory(null);
            // Force re-render
            updateFilter('page', filters.page);
        }, 1000);
    };

    const handleDelete = (category) => {
        if (category.productsCount > 0) {
            toast.add({ type: 'error', title: 'Error!', description: `Cannot delete "${category.name}". ${category.productsCount} product(s) are associated with this category.` });
            return;
        }
        if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            toast.add({ type: 'success', title: 'Success!', description: `Category "${category.name}" deleted successfully!` });
        }
    };

    const handleDeactivate = (category) => {
        const idx = DUMMY_CATEGORIES.findIndex(c => c._id === category._id);
        if (idx !== -1) {
            DUMMY_CATEGORIES[idx].isActive = !DUMMY_CATEGORIES[idx].isActive;
            toast.add({ type: 'success', title: 'Success!', description: `Category "${category.name}" ${DUMMY_CATEGORIES[idx].isActive ? 'activated' : 'deactivated'} successfully!` });
            updateFilter('page', filters.page); // trigger re-render
        }
    };

    const hasActiveFilters = filters.search || filters.status !== 'all';

    // Column definitions
    const columns = [
        {
            key: 'name',
            header: 'Category Name',
            headerClassName: 'min-w-37.5',
            cellClassName: 'font-medium',
            render: (cat) => (
                <>
                    {cat.name}
                    <div className="sm:hidden text-[10px] text-muted-foreground">{cat.categorySlug}</div>
                </>
            ),
        },
        {
            key: 'slug',
            header: 'Slug',
            headerClassName: 'min-w-30',
            cellClassName: 'text-xs text-muted-foreground',
            render: (cat) => cat.categorySlug,
        },
        {
            key: 'products',
            header: 'Products',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-center',
            render: (cat) => (
                <div className="flex items-center justify-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{cat.productsCount}</span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            headerClassName: 'min-w-25 text-center',
            cellClassName: 'text-center',
            render: (cat) => (
                <Badge variant={cat.isActive ? 'default' : 'destructive'} className="text-[10px]">
                    {cat.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            key: 'createdBy',
            header: 'Created By',
            headerClassName: 'min-w-37.5',
            cellClassName: 'text-xs',
            render: (cat) => (
                <>
                    {cat.createdBy?.name || 'N/A'}
                    <div className="text-[10px] text-muted-foreground">{cat.createdBy?.role || ''}</div>
                </>
            ),
        },
        {
            key: 'createdAt',
            header: 'Created',
            headerClassName: 'min-w-32.5',
            cellClassName: 'text-xs text-muted-foreground',
            render: (cat) => formatDate(cat.createdAt),
        },
        {
            key: 'actions',
            header: 'Actions',
            headerClassName: 'min-w-25 text-right',
            cellClassName: 'text-right',
            render: (cat) => (
                <DropdownMenu>
                    <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                            <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => handleEditCategory(cat)}>
                                <Edit className="mr-2 h-3.5 w-3.5" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onClick={() => handleDeactivate(cat)}
                                variant={cat.isActive ? 'destructive' : 'default'}
                            >
                                <CircleX className="mr-2 h-3.5 w-3.5" />
                                {cat.isActive ? 'Deactivate' : 'Activate'}
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
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                        Manage your product categories.
                    </p>
                </div>
                <Button className="w-35 flex items-center justify-center md:w-auto" onClick={handleAddCategory}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add Category
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard title="Total Categories" value={totalCategories} icon={Tags} caption="All categories" />
                <StatsCard
                    title="Active Categories"
                    value={activeCategories}
                    icon={CheckCircle}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={`${Math.round((activeCategories / totalCategories) * 100)}% of total`}
                />
                <StatsCard
                    title="Inactive Categories"
                    value={inactiveCategories}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="No products assigned"
                />
            </div>

            {/* Search and Filters — Side by Side (inline, no mobile scroll breakpoint) */}
            <div className="flex flex-row gap-3">
                <FilterSearchInput
                    placeholder="Search categories..."
                    value={filters.search}
                    onChange={updateFilter}
                    className="relative flex-1 max-w-140"
                />
                <FilterDropdown
                    label={`Status: ${getStatusLabel(filters.status)}`}
                    options={STATUS_OPTIONS}
                    onSelect={(v) => updateFilter('status', v)}
                    menuLabel="Status"
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

            {/* Table + Pagination */}
            <DataTable
                columns={columns}
                data={paginatedCategories}
                getRowKey={(cat) => cat._id}
                emptyMessage="No categories found."
                tableMinWidth="min-w-200"
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

            {/* Add/Edit Category Dialog — kept as-is (form dialog, not ConfirmDialog) */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-106.25">
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
                            onClick={() => { setIsDialogOpen(false); setCategoryName(''); setEditingCategory(null); }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={!categoryName.trim() || isLoading}>
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