'use client';
import { useState, useRef, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ArrowLeft,
    Image as ImageIcon,
    X,
    Loader2,
    Plus,
    Search,
    Minus,
    Check,
    Package,
} from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

// ─── Image Fallback Component ────────────────────────────────────────────────

const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};

const getColorFromName = (name) => {
    const colors = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-teal-500',
        'bg-orange-500',
        'bg-cyan-500',
        'bg-amber-500',
        'bg-lime-500',
        'bg-emerald-500',
        'bg-rose-500',
        'bg-violet-500',
        'bg-fuchsia-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const MenuItemImage = ({ item }) => {
    const hasImage = item.imageUrl && item.imageUrl.trim() !== '';

    if (hasImage) {
        return (
            <div className="relative h-8 w-8 overflow-hidden rounded-md">
                <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                />
            </div>
        );
    }

    const initials = getInitials(item.name);
    const bgColor = getColorFromName(item.name);

    return (
        <div className={cn(
            'h-8 w-8 rounded-md flex items-center justify-center text-white font-medium text-xs',
            bgColor
        )}>
            {initials}
        </div>
    );
};

// Zod schema for validation with all fields
const dealItemSchema = z.object({
    _id: z.string(),
    name: z.string(),
    unitPrice: z.number().positive(),
    quantity: z.number().int().positive(),
    subtotal: z.number().nonnegative(),
});

const dealSchema = z.object({
    name: z.string().min(2, { message: 'Deal name must be at least 2 characters' }),
    description: z.string()
        .min(1, { message: 'Description is required' })
        .max(350, { message: 'Description cannot exceed 350 characters' }),
    costPrice: z.coerce.number()
        .nonnegative({ message: 'Cost price cannot be negative' }),
    sellingPrice: z.coerce.number()
        .positive({ message: 'Selling price must be greater than 0' }),
    numberOfItems: z.coerce.number()
        .int()
        .nonnegative({ message: 'Number of items must be 0 or greater' }),
    items: z.array(dealItemSchema)
        .min(1, { message: 'At least one item is required for a deal' }),
    imageUrl: z.string().url().optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).default('active'),
});

import { useCreateDeal, useMenuItems } from '@/hooks/useApi';

const DealAdd = () => {
    const router = useRouter();

    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const { data: menuItemsResponse } = useMenuItems({ limit: 100 });
    const createDealMutation = useCreateDeal();
    const availableMenuItemsList = menuItemsResponse?.data || [];

    // Deal items state
    const [dealItems, setDealItems] = useState([]);

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogSearch, setDialogSearch] = useState('');

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        getValues,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(dealSchema),
        defaultValues: {
            name: '',
            description: '',
            costPrice: 0,
            sellingPrice: '',
            numberOfItems: 0,
            items: [],
            imageUrl: '',
            status: 'active',
        },
    });

    const watchedName = watch('name');
    const watchedDescription = watch('description');
    const watchedSellingPrice = watch('sellingPrice');

    // Calculate cost price (sum of all item subtotals)
    const calculateCostPrice = (items) => {
        return items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    };

    const costPrice = calculateCostPrice(dealItems);
    const profit = parseFloat(watchedSellingPrice || '0') - costPrice;

    // Update form values when dealItems change
    useEffect(() => {
        setValue('costPrice', costPrice);
        setValue('numberOfItems', dealItems.length);
        setValue('items', dealItems);

        // Clear items error if there are items
        if (dealItems.length > 0) {
            clearErrors('items');
        }
    }, [dealItems, setValue, clearErrors]);

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.add({
                    type: "error",
                    title: "File too large",
                    description: "Image must be less than 5MB",
                });
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                toast.add({
                    type: "error",
                    title: "Invalid file type",
                    description: "Please upload PNG, JPG, or WEBP images",
                });
                return;
            }

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
        setValue('imageUrl', '');
    };

    // Handle image click to trigger file input
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Handle adding items from dialog
    const handleAddItems = (selectedItems) => {
        const newItems = selectedItems.map(item => ({
            _id: item._id || item.id,
            name: item.name,
            unitPrice: item.price || item.sellingPrice,
            quantity: 1,
            subtotal: item.price || item.sellingPrice,
        }));
        setDealItems([...dealItems, ...newItems]);
        setDialogSearch('');
        setIsDialogOpen(false);
        toast.add({
            type: "success",
            title: "Success!",
            description: `${newItems.length} item(s) added to deal!`,
        });
    };

    // Handle removing item from deal
    const handleRemoveItem = (itemId) => {
        setDealItems(dealItems.filter(item => item._id !== itemId));
    };

    // Handle quantity change
    const handleQuantityChange = (itemId, change) => {
        setDealItems(prevItems =>
            prevItems.map(item => {
                if (item._id === itemId) {
                    const newQuantity = Math.max(1, item.quantity + change);
                    return {
                        ...item,
                        quantity: newQuantity,
                        subtotal: item.unitPrice * newQuantity,
                    };
                }
                return item;
            })
        );
    };

    // Get available items (not already in deal)
    const getAvailableItems = () => {
        return availableMenuItemsList.filter(item =>
            !dealItems.find(di => di._id === (item._id || item.id))
        );
    };

    // Filter menu items for dialog
    const filteredMenuItems = getAvailableItems().filter(item =>
        item.name.toLowerCase().includes(dialogSearch.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(dialogSearch.toLowerCase()))
    );

    // Handle form submission
    const onSubmit = async (values) => {
        const sellingPrice = typeof values.sellingPrice === 'string'
            ? parseFloat(values.sellingPrice)
            : values.sellingPrice;

        if (dealItems.length === 0) {
            toast.add({
                type: "error",
                title: "Error!",
                description: "Please add at least one menu item to the deal",
            });
            return;
        }

        if (isNaN(sellingPrice) || sellingPrice <= 0) {
            toast.add({
                type: "error",
                title: "Error!",
                description: "Selling price must be greater than 0",
            });
            return;
        }

        try {
            await createDealMutation.mutateAsync({
                name: values.name,
                description: values.description,
                costPrice: costPrice,
                sellingPrice: sellingPrice,
                numberOfItems: dealItems.length,
                items: dealItems,
                status: values.status,
                file: selectedFile || undefined
            });

            toast.add({
                type: "success",
                title: "Success!",
                description: "Deal created successfully!",
            });
            router.push('/deals');

        } catch (error) {
            console.error('Submit error:', error);
            toast.add({
                type: "error",
                title: "Error!",
                description: error?.response?.data?.message || "Failed to create deal",
            });
        }
    };

    // Dialog state for selected items
    const [selectedDialogItems, setSelectedDialogItems] = useState([]);

    // Toggle item selection in dialog
    const toggleItemSelection = (item) => {
        setSelectedDialogItems(prev => {
            const exists = prev.find(i => i._id === item._id);
            if (exists) {
                return prev.filter(i => i._id !== item._id);
            } else {
                return [...prev, item];
            }
        });
    };

    // Handle add selected from dialog
    const handleAddSelected = () => {
        if (selectedDialogItems.length === 0) return;
        handleAddItems(selectedDialogItems);
        setSelectedDialogItems([]);
    };

    // Reset dialog state when closed
    const handleDialogOpenChange = (open) => {
        setIsDialogOpen(open);
        if (!open) {
            setSelectedDialogItems([]);
            setDialogSearch('');
        }
    };

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
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Add Deal</h1>
                        </div>
                        <p className="text-sm text-muted-foreground">Create a new deal/combo</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-5">
                        {/* Image Upload */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium">Deal Image</FieldLabel>
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
                                                    alt="Deal preview"
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
                            </FieldContent>
                        </Field>

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">Basic Information</h2>

                            {/* Deal Name */}
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="name" className="text-sm font-medium">
                                    Deal Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter deal name"
                                        className="h-10 text-sm"
                                        {...register("name")}
                                        aria-invalid={errors.name ? "true" : "false"}
                                    />
                                    {errors.name && (
                                        <FieldError errors={[errors.name]} />
                                    )}
                                </FieldContent>
                            </Field>

                            {/* Description */}
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="description" className="text-sm font-medium">
                                    Description <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Write a short description of this deal..."
                                        className="h-25 text-sm resize-none"
                                        maxLength={350}
                                        {...register("description")}
                                        aria-invalid={errors.description ? "true" : "false"}
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <div>
                                            {errors.description && (
                                                <FieldError errors={[errors.description]} />
                                            )}
                                        </div>
                                        <span className={cn(
                                            "text-xs",
                                            (watchedDescription?.length || 0) > 300 ? "text-yellow-500" : "text-muted-foreground"
                                        )}>
                                            {watchedDescription?.length || 0} / 350 Characters
                                        </span>
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Deal Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-muted-foreground">Deal Items</h2>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setIsDialogOpen(true)}
                                    disabled={getAvailableItems().length === 0}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                    Add Menu Item
                                </Button>
                            </div>

                            {errors.items && (
                                <p className="text-sm text-destructive">{errors.items.message}</p>
                            )}

                            {/* Always show the table with headings */}
                            <div className="border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Menu Item</TableHead>
                                            <TableHead className="text-right">Unit Price</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                            <TableHead className="w-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dealItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    No items selected for this deal
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dealItems.map((item) => (
                                                <TableRow key={item._id}>
                                                    <TableCell className="font-medium text-sm">
                                                        {item.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        Rs. {item.unitPrice}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleQuantityChange(item._id, -1)}
                                                                disabled={item.quantity <= 1}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="text-sm font-medium w-6 text-center">
                                                                {item.quantity}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => handleQuantityChange(item._id, 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        Rs. {item.subtotal}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive hover:text-destructive"
                                                            onClick={() => handleRemoveItem(item._id)}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                    {dealItems.length > 0 && (
                                        <TableFooter>
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-right font-medium">
                                                    Total Cost
                                                </TableCell>
                                                <TableCell className="text-right font-bold">
                                                    Rs. {costPrice}
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                                </Table>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-4">
                            <h2 className="text-sm font-semibold text-muted-foreground">Pricing</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {/* Cost Price - Read Only */}
                                <Field orientation="vertical">
                                    <FieldLabel className="text-sm font-medium">
                                        Cost Price <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm">
                                            Rs. {costPrice || 0}
                                        </div>
                                        <input type="hidden" {...register('costPrice')} />
                                        {errors.costPrice && (
                                            <FieldError errors={[errors.costPrice]} />
                                        )}
                                    </FieldContent>
                                </Field>

                                {/* Selling Price */}
                                <Field orientation="vertical">
                                    <FieldLabel htmlFor="sellingPrice" className="text-sm font-medium">
                                        Selling Price <span className="text-destructive">*</span>
                                    </FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="sellingPrice"
                                            type="number"
                                            step="1"
                                            min="0"
                                            placeholder="0"
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

                            {/* Number of Items - Hidden field */}
                            <input type="hidden" {...register('numberOfItems')} />
                            <input type="hidden" {...register('status')} />

                            {/* Estimated Profit */}
                            {watchedSellingPrice && costPrice > 0 && (
                                <div className={cn(
                                    "p-3 rounded-md",
                                    profit >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20"
                                )}>
                                    <p className="text-sm">
                                        Estimated Profit:{' '}
                                        <span className={cn(
                                            "font-medium",
                                            profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                                        )}>
                                            Rs. {profit}
                                        </span>
                                        {profit >= 0 && costPrice > 0 && (
                                            <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                                                ({(profit / costPrice * 100).toFixed(1)}% margin)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-auto"
                                onClick={() => router.push('/deals')}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="w-auto"
                                disabled={createDealMutation.isPending}
                            >
                                {createDealMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Save Deal'
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>

                {/* Add Menu Item Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add Menu Items</DialogTitle>
                            <DialogDescription>
                                Select items to add to this deal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search menu items..."
                                    value={dialogSearch}
                                    onChange={(e) => setDialogSearch(e.target.value)}
                                    className="pl-8 h-9 text-sm"
                                />
                            </div>

                            {/* Items List */}
                            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12">Select</TableHead>
                                            <TableHead>Image</TableHead>
                                            <TableHead>Menu Item</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMenuItems.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                    {getAvailableItems().length === 0 ? 'All items added to deal' : 'No menu items found'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredMenuItems.map((item) => {
                                                const isSelected = selectedDialogItems.find(i => i._id === item._id);
                                                return (
                                                    <TableRow
                                                        key={item._id}
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => toggleItemSelection(item)}
                                                    >
                                                        <TableCell>
                                                            <div className={cn(
                                                                "h-4 w-4 border rounded flex items-center justify-center transition-colors",
                                                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                                                            )}>
                                                                {isSelected && <Check className="h-3 w-3 text-white" />}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <MenuItemImage item={item} />
                                                        </TableCell>
                                                        <TableCell className="font-medium text-sm">
                                                            {item.name}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {item.category}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            Rs. {item.price}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Selected count */}
                            <div className="text-sm text-muted-foreground">
                                {selectedDialogItems.length} item(s) selected
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsDialogOpen(false);
                                setSelectedDialogItems([]);
                                setDialogSearch('');
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleAddSelected} disabled={selectedDialogItems.length === 0}>
                                Add Selected ({selectedDialogItems.length})
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default DealAdd;