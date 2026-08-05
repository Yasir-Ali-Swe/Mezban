'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
    FieldContent,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Image as ImageIcon,
    X,
    Loader2,
    AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Zod schema for validation
const productSchema = z.object({
    name: z.string().min(2, { message: 'Product name must be at least 2 characters' }),
    unit: z.string().min(1, { message: 'Unit is required' }),
    categoryId: z.string().min(1, { message: 'Please select a category' }),
    quantity: z.string()
        .min(1, { message: 'Quantity is required' })
        .transform(val => parseInt(val))
        .refine(val => val > 0, { message: 'Quantity must be greater than 0' }),
    reorderThreshold: z.string()
        .optional()
        .transform(val => val ? parseInt(val) : 10)
        .refine(val => val >= 0, { message: 'Reorder threshold cannot be negative' }),
    costPrice: z.string().min(1, { message: 'Cost price is required' }).transform(val => parseFloat(val)),
    sellingPrice: z.string().min(1, { message: 'Selling price is required' }).transform(val => parseFloat(val)),
});

// Dummy Data
const DUMMY_PRODUCT = {
    _id: '1',
    name: 'Wireless Bluetooth Headphones',
    unit: 'pcs',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
    sellingPrice: 79.99,
    costPrice: 45.50,
    quantity: 45,
    reorderThreshold: 10,
    isActive: true,
    category: { _id: '1', name: 'Electronics', categorySlug: 'electronics' },
    categoryId: { _id: '1', name: 'Electronics' },
    createdAt: '2026-01-15T10:30:00Z',
};

const DUMMY_CATEGORIES = [
    { _id: '1', name: 'Electronics', categorySlug: 'electronics' },
    { _id: '2', name: 'Clothing', categorySlug: 'clothing' },
    { _id: '3', name: 'Kitchen', categorySlug: 'kitchen' },
    { _id: '4', name: 'Beverages', categorySlug: 'beverages' },
    { _id: '5', name: 'Accessories', categorySlug: 'accessories' },
    { _id: '6', name: 'Fitness', categorySlug: 'fitness' },
    { _id: '7', name: 'Home Office', categorySlug: 'home-office' },
];

const DUMMY_UNITS = [
    { _id: '1', name: 'pcs' },
    { _id: '2', name: 'kg' },
];

const ProductEdit = ({ params }) => {
    const router = useRouter();
    const { id } = params;

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Use dummy product data
    const product = DUMMY_PRODUCT;
    const categoriesList = DUMMY_CATEGORIES;
    const unitsList = DUMMY_UNITS;

    const [originalValues, setOriginalValues] = useState({
        name: '',
        unit: '',
        categoryId: '',
        quantity: '',
        reorderThreshold: '10',
        costPrice: '',
        sellingPrice: '',
    });

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: '',
            unit: '',
            categoryId: '',
            quantity: '',
            reorderThreshold: '10',
            costPrice: '',
            sellingPrice: '',
        },
    });

    const selectedCategoryId = watch('categoryId');
    const selectedUnit = watch('unit');
    const watchedName = watch('name');
    const watchedUnit = watch('unit');
    const watchedCategoryId = watch('categoryId');
    const watchedQuantity = watch('quantity');
    const watchedReorderThreshold = watch('reorderThreshold');
    const watchedCostPrice = watch('costPrice');
    const watchedSellingPrice = watch('sellingPrice');

    // Calculate profit margin
    const calculateProfitMargin = () => {
        if (!watchedCostPrice || !watchedSellingPrice) return null;
        const cost = parseFloat(watchedCostPrice);
        const selling = parseFloat(watchedSellingPrice);
        const profit = selling - cost;
        const margin = (profit / cost) * 100;
        return { profit, margin };
    };

    // Get selected category name
    const getSelectedCategoryName = () => {
        if (!selectedCategoryId) return '';
        const category = categoriesList.find(c => c._id === selectedCategoryId);
        return category ? category.name : '';
    };

    // Sync input values on detail load
    useEffect(() => {
        if (product) {
            const vals = {
                name: product.name || '',
                unit: product.unit || '',
                categoryId: product.categoryId?._id || product.categoryId || product.category?._id || product.category || '',
                quantity: product.quantity?.toString() || '',
                reorderThreshold: product.reorderThreshold?.toString() || '10',
                costPrice: product.costPrice?.toString() || '',
                sellingPrice: product.sellingPrice?.toString() || '',
            };
            reset(vals);
            setOriginalValues(vals);
            if (product.imageUrl) {
                setImagePreview(product.imageUrl);
            }
        }
    }, [product, reset]);

    // Check if form has changes
    const hasChanges = () => {
        return (
            watchedName !== originalValues.name ||
            watchedUnit !== originalValues.unit ||
            watchedCategoryId !== originalValues.categoryId ||
            watchedQuantity !== originalValues.quantity ||
            watchedReorderThreshold !== originalValues.reorderThreshold ||
            watchedCostPrice !== originalValues.costPrice ||
            watchedSellingPrice !== originalValues.sellingPrice ||
            selectedFile !== null
        );
    };

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    // Handle image removal
    const handleRemoveImage = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle image click to trigger file input
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Handle form submission
    const onSubmit = async (values) => {
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Show success message
        toast.success('Product updated successfully!');
        setIsLoading(false);

        // Navigate back to product details
        router.push(`/products`);
    };

    const profitData = calculateProfitMargin();

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-full">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Edit Product</h1>
                            <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-[10px]">
                                {product.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {product.quantity <= product.reorderThreshold && product.quantity > 0 && (
                                <Badge variant="destructive" className="text-[10px]">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                    Low Stock
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">Update product information</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-5">
                        {/* Image Upload - Top */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium">Product Image</FieldLabel>
                            <FieldContent>
                                <div
                                    className={cn(
                                        "relative border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                                        imagePreview ? "border-primary" : "border-muted-foreground/25 hover:border-primary/50",
                                        "min-h-37.5 flex flex-col items-center justify-center rounded-3xl"
                                    )}
                                    onClick={handleImageClick}
                                >
                                    {imagePreview ? (
                                        <>
                                            <div className="relative h-32 w-32">
                                                <Image
                                                    src={imagePreview}
                                                    alt="Product preview"
                                                    fill
                                                    className="object-cover"
                                                    sizes="128px"
                                                />
                                            </div>
                                            <div className="absolute top-2 right-2">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveImage();
                                                    }}
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Click to change image
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex h-12 w-12 items-center justify-center bg-muted rounded-md">
                                                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="mt-2 text-sm font-medium">Upload Image</p>
                                            <p className="text-xs text-muted-foreground">
                                                Click or drag and drop
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                PNG, JPG, WEBP (max 5MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                {selectedFile && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Selected: {selectedFile.name}
                                    </p>
                                )}
                            </FieldContent>
                        </Field>

                        {/* Row 1: Name + Unit */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="name" className="text-sm font-medium">
                                    Product Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter product name"
                                        className="h-10 text-sm"
                                        {...register("name")}
                                        aria-invalid={errors.name ? "true" : "false"}
                                    />
                                    {errors.name && (
                                        <FieldError errors={[errors.name]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="unit" className="text-sm font-medium">
                                    Unit <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={selectedUnit}
                                        onValueChange={(value) => setValue("unit", value)}
                                    >
                                        <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                            <SelectValue placeholder="Select a unit">
                                                {selectedUnit ? unitsList.find(u => u.name === selectedUnit)?.name : ''}
                                            </SelectValue>
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Units</SelectLabel>
                                                {unitsList.map((unit) => (
                                                    <SelectItem
                                                        key={unit._id}
                                                        value={unit.name}
                                                    >
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <div className="mt-1 min-h-10">
                                        {errors.unit && (
                                            <FieldError errors={[errors.unit]} />
                                        )}
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 3: Quantity + Reorder Threshold */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="quantity" className="text-sm font-medium">
                                    Quantity <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        placeholder="0"
                                        className="h-10 text-sm"
                                        {...register("quantity")}
                                        aria-invalid={errors.quantity ? "true" : "false"}
                                    />
                                    {errors.quantity && (
                                        <FieldError errors={[errors.quantity]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="reorderThreshold" className="text-sm font-medium">
                                    Reorder Threshold <span className="text-xs text-muted-foreground">(Optional)</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="reorderThreshold"
                                        type="number"
                                        min="0"
                                        placeholder="10"
                                        className="h-10 text-sm"
                                        {...register("reorderThreshold")}
                                        aria-invalid={errors.reorderThreshold ? "true" : "false"}
                                    />
                                    {errors.reorderThreshold && (
                                        <FieldError errors={[errors.reorderThreshold]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 4: Cost Price + Selling Price */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="costPrice" className="text-sm font-medium">
                                    Cost Price ($) <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="costPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="h-10 text-sm"
                                        {...register("costPrice")}
                                        aria-invalid={errors.costPrice ? "true" : "false"}
                                    />
                                    {errors.costPrice && (
                                        <FieldError errors={[errors.costPrice]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="sellingPrice" className="text-sm font-medium">
                                    Selling Price ($) <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="sellingPrice"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="h-10 text-sm"
                                        {...register("sellingPrice")}
                                        aria-invalid={errors.sellingPrice ? "true" : "false"}
                                    />
                                    {errors.sellingPrice && (
                                        <FieldError errors={[errors.sellingPrice]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Profit Margin Display with Color Coding */}
                        {watchedCostPrice && watchedSellingPrice && profitData && (
                            <div className={cn(
                                "p-3 rounded-md",
                                profitData.profit >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                            )}>
                                <p className="text-sm">
                                    Profit Margin:{' '}
                                    <span className={cn(
                                        "font-medium",
                                        profitData.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        ${profitData.profit.toFixed(2)}
                                    </span>
                                    {' '}
                                    <span className={cn(
                                        "text-xs",
                                        profitData.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                    )}>
                                        ({profitData.margin.toFixed(1)}% {profitData.profit >= 0 ? 'markup' : 'loss'})
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Row 2: Category only */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Category */}
                            <Field orientation="vertical" className="flex flex-col">
                                <FieldLabel htmlFor="categoryId" className="text-sm font-medium">
                                    Category <span className="text-destructive">*</span>
                                </FieldLabel>

                                <FieldContent className="flex flex-col">
                                    <Select
                                        value={selectedCategoryId}
                                        onValueChange={(value) => setValue("categoryId", value)}
                                    >
                                        <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                            <SelectValue placeholder="Select a category">
                                                {getSelectedCategoryName()}
                                            </SelectValue>
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Categories</SelectLabel>

                                                {categoriesList.map((category) => (
                                                    <SelectItem
                                                        key={category._id}
                                                        value={category._id}
                                                    >
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>

                                    <div className="mt-1 min-h-10">
                                        {errors.categoryId ? (
                                            <FieldError errors={[errors.categoryId]} />
                                        ) : selectedCategoryId ? (
                                            <p className="text-xs text-muted-foreground">
                                                Slug:{" "}
                                                {
                                                    categoriesList.find(
                                                        (c) => c._id === selectedCategoryId
                                                    )?.categorySlug
                                                }
                                            </p>
                                        ) : null}
                                    </div>
                                </FieldContent>
                            </Field>

                            {/* Empty div for spacing */}
                            <div />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-auto"
                                onClick={() => router.push(`/products`)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="w-auto"
                                disabled={!hasChanges() || isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Product'
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default ProductEdit;