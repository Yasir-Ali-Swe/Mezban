'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
    FilterSearchInput,
    FilterDropdown,
    DataTable,
    PaginationFooter,
} from '@/components/dashboard';
import StatCard from '@/components/shared/StatCard';

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

import {
    useCategories,
    useCategoryStats,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
} from '@/hooks/useApi';

// ─── Component ────────────────────────────────────────────────────────────────

const CategoriesList = () => {
    const { filters, updateFilter, resetFilters, getPageNums } = useUrlFilters(FILTER_DEFAULTS);

    const { data: responseData, isLoading: isFetching } = useCategories(filters);
    const { data: statsResponse } = useCategoryStats();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();
    const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending;

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');

    const categoriesList = responseData?.data || [];
    const pagination = responseData?.pagination || { page: 1, total: 0, totalPages: 1 };

    // Stats from dedicated endpoint
    const statsData = statsResponse?.data || {};
    const totalCategories = statsData.totalCategories ?? pagination.total ?? categoriesList.length;
    const activeCategories = statsData.activeCategories ?? categoriesList.filter(c => c.isActive).length;
    const inactiveCategories = statsData.inactiveCategories ?? categoriesList.filter(c => !c.isActive).length;

    // Pagination
    const totalFiltered = totalCategories;
    const totalPages = pagination.totalPages || 1;
    const startIndex = (filters.page - 1) * filters.limit;
    const endIndex = Math.min(startIndex + filters.limit, totalFiltered);
    const paginatedCategories = categoriesList;

    const handleAddCategory = () => { setEditingCategory(null); setCategoryName(''); setIsDialogOpen(true); };
    const handleEditCategory = (category) => { setEditingCategory(category); setCategoryName(category.name); setIsDialogOpen(true); };

    const handleSaveCategory = async () => {
        if (!categoryName.trim()) {
            toast.add({ type: 'error', title: 'Error!', description: 'Category name is required' });
            return;
        }

        try {
            if (editingCategory) {
                await updateCategoryMutation.mutateAsync({
                    id: editingCategory._id || editingCategory.id,
                    name: categoryName.trim(),
                });
                toast.add({ type: 'success', title: 'Success!', description: `Category "${categoryName}" updated successfully!` });
            } else {
                await createCategoryMutation.mutateAsync({
                    name: categoryName.trim(),
                });
                toast.add({ type: 'success', title: 'Success!', description: `Category "${categoryName}" created successfully!` });
            }
            setIsDialogOpen(false);
            setCategoryName('');
            setEditingCategory(null);
        } catch (error) {
            toast.add({ type: 'error', title: 'Error!', description: error.response?.data?.message || 'Failed to save category' });
        }
    };

    const handleDelete = async (category) => {
        if (category.productsCount > 0) {
            toast.add({ type: 'error', title: 'Error!', description: `Cannot delete "${category.name}". ${category.productsCount} item(s) are associated with this category.` });
            return;
        }
        if (confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            try {
                await deleteCategoryMutation.mutateAsync(category._id || category.id);
                toast.add({ type: 'success', title: 'Success!', description: `Category "${category.name}" deleted successfully!` });
            } catch (error) {
                toast.add({ type: 'error', title: 'Error!', description: error.response?.data?.message || 'Failed to delete category' });
            }
        }
    };

    const handleDeactivate = async (category) => {
        try {
            await updateCategoryMutation.mutateAsync({
                id: category._id || category.id,
                isActive: !category.isActive,
            });
            toast.add({ type: 'success', title: 'Success!', description: `Category "${category.name}" ${!category.isActive ? 'activated' : 'deactivated'} successfully!` });
        } catch (error) {
            toast.add({ type: 'error', title: 'Error!', description: error.response?.data?.message || 'Failed to update category status' });
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
            header: 'Items',
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
                <StatusBadge status={cat.isActive} showIcon />
            ),
        },
        {
            key: 'createdBy',
            header: 'Created By',
            headerClassName: 'min-w-37.5',
            cellClassName: 'text-xs font-medium',
            render: (cat) => cat.createdBy?.name || 'N/A',
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
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 cursor-pointer">
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
                <StatCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={Tags}
                    caption="All categories"
                    iconClassName="text-chart-2"
                />
                <StatCard
                    title="Active Categories"
                    value={activeCategories}
                    icon={CheckCircle}
                    iconClassName="text-primary"
                    valueClassName="text-primary"
                    caption={totalCategories > 0 ? `${Math.round((activeCategories / totalCategories) * 100)}% of total` : '0% of total'}
                />
                <StatCard
                    title="Inactive Categories"
                    value={inactiveCategories}
                    icon={XCircle}
                    iconClassName="text-destructive"
                    valueClassName="text-destructive"
                    caption="No items assigned"
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
                        <Button onClick={handleSaveCategory} disabled={!categoryName.trim() || isSubmitting}>
                            {isSubmitting ? (
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
