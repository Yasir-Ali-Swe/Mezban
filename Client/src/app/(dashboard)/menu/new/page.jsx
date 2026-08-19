'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

// Zod schema for validation
const menuItemSchema = z.object({
    name: z.string().min(2, { message: 'Item name must be at least 2 characters' }),
    category: z.string().min(1, { message: 'Please select a category' }),
    costPrice: z.string().min(1, { message: 'Cost price is required' }).transform(val => parseFloat(val)),
    sellingPrice: z.string().min(1, { message: 'Selling price is required' }).transform(val => parseFloat(val)),
    status: z.enum(['available', 'unavailable']),
});

import { useCreateMenuItem, useCategories } from '@/hooks/useApi';

const MenuAdd = () => {
    const router = useRouter();

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const { data: categoriesResponse } = useCategories({ limit: 100 });
    const createMenuItemMutation = useCreateMenuItem();

    const categoriesList = categoriesResponse?.data || [];

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(menuItemSchema),
        defaultValues: {
            name: '',
            category: '',
            costPrice: '',
            sellingPrice: '',
            status: 'available',
        },
    });

    const selectedCategory = watch('category');
    const watchedCostPrice = watch('costPrice');
    const watchedSellingPrice = watch('sellingPrice');
    const watchedStatus = watch('status');

    // Calculate profit margin
    const calculateProfitMargin = () => {
        if (!watchedCostPrice || !watchedSellingPrice) return null;
        const cost = parseFloat(watchedCostPrice);
        const selling = parseFloat(watchedSellingPrice);
        const profit = selling - cost;
        const margin = (profit / cost) * 100;
        return { profit, margin };
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
        try {
            await createMenuItemMutation.mutateAsync({
                name: values.name,
                category: values.category,
                costPrice: values.costPrice,
                sellingPrice: values.sellingPrice,
                status: values.status,
                imageUrl: imagePreview || null,
                file: selectedFile || undefined,
            });

            toast.add({
                type: "success",
                title: "Success!",
                description: "Menu item created successfully!",
            });
            router.push('/menu');
        } catch (error) {
            toast.add({
                type: "error",
                title: "Error!",
                description: error.response?.data?.message || "Failed to create menu item",
            });
        }
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
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Add Menu Item</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Create a new menu item</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-5">
                        {/* Image Upload - Top */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium">Menu Item Image</FieldLabel>
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
                                                    alt="Menu item preview"
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

                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">Basic Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Menu Item Name */}
                                <Field orientation="vertical">
                                    <FieldLabel htmlFor="name" className="text-sm font-medium">
                                        Menu Item Name <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Enter menu item name"
                                            className="h-10 text-sm"
                                            {...register("name")}
                                            aria-invalid={errors.name ? "true" : "false"}
                                        />
                                        {errors.name && (
                                            <FieldError errors={[errors.name]} />
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Category */}
                                <Field orientation="vertical" className="flex flex-col">
                                    <FieldLabel htmlFor="category" className="text-sm font-medium">
                                        Category <span className="text-destructive">*</span>
                                    </FieldLabel>

                                    <FieldContent className="flex flex-col">
                                        <Select
                                            value={selectedCategory}
                                            onValueChange={(value) => setValue("category", value)}
                                        >
                                            <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Categories</SelectLabel>
                                                    {categoriesList.map((category) => (
                                                        <SelectItem
                                                            key={category._id}
                                                            value={category.name}
                                                        >
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>

                                        <div className="mt-1 min-h-10">
                                            {errors.category ? (
                                                <FieldError errors={[errors.category]} />
                                            ) : null}
                                        </div>
                                    </FieldContent>
                                </Field>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">Pricing</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Cost Price */}
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

                                {/* Selling Price */}
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

                        {/* Status Section */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">Status</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Status */}
                                <Field orientation="vertical">
                                    <FieldLabel className="text-sm font-medium">
                                        Status
                                    </FieldLabel>
                                    <FieldContent>
                                        <div className="flex items-center gap-2 bg-muted p-1 rounded-md w-fit">
                                            <Button
                                                type="button"
                                                variant={watchedStatus === 'available' ? 'default' : 'ghost'}
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setValue('status', 'available')}
                                            >
                                                Available
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={watchedStatus === 'unavailable' ? 'destructive' : 'ghost'}
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={() => setValue('status', 'unavailable')}
                                            >
                                                Unavailable
                                            </Button>
                                        </div>
                                        <input type="hidden" {...register('status')} />
                                    </FieldContent>
                                </Field>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-auto"
                                onClick={() => router.push('/menu')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className=" w-auto"
                                disabled={createMenuItemMutation.isPending}
                            >
                                {createMenuItemMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Save Menu Item'
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default MenuAdd;