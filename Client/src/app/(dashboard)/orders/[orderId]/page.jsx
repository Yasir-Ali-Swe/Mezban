'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    User,
    Phone,
    MessageCircle,
    Mail,
    Clock,
    Calendar,
    Package,
    Receipt,
    Loader2,
    XCircle,
    Circle,
    Copy,
    Check,
    MapPin,
    AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Status configuration
// The four "active" states form a real sequence an order moves through, so a
// step tracker is the honest way to show progress. Cancellation is a branch
// off that line, not a fifth step.
// ---------------------------------------------------------------------------
const ACTIVE_FLOW = ['pending', 'confirmed', 'processing', 'completed'];

const STATUS_CONFIG = {
    pending: { label: 'Pending', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900' },
    confirmed: { label: 'Confirmed', dot: 'bg-sky-500', text: 'text-sky-700 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900' },
    processing: { label: 'Processing', dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-900' },
    completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900' },
};

const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

// Dummy order data — replace with a real fetch against your API.
const DUMMY_ORDER = {
    _id: 'ord_001',
    orderNumber: 'ORD-2024-001',
    customer: {
        name: 'John Doe',
        phone: '+1 (555) 123-4567',
        telegramChatId: '123456789',
        email: 'john.doe@example.com',
    },
    status: 'processing',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    items: [
        {
            _id: 'item_001',
            productId: 'prod_001',
            productName: 'Wireless Bluetooth Headphones',
            productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
            quantity: 2,
            unitPrice: 79.99,
            subtotal: 159.98,
        },
        {
            _id: 'item_002',
            productId: 'prod_002',
            productName: 'Premium Cotton T-Shirt',
            productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
            quantity: 1,
            unitPrice: 29.99,
            subtotal: 29.99,
        },
        {
            _id: 'item_003',
            productId: 'prod_003',
            productName: 'Stainless Steel Water Bottle',
            productImage: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop',
            quantity: 3,
            unitPrice: 24.99,
            subtotal: 74.97,
        },
    ],
    subtotal: 264.94,
    tax: 21.20,
    shipping: 5.99,
    total: 292.13,
    shippingAddress: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
    },
    notes: 'Please deliver between 2-5 PM',
};

const currency = (value) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value ?? 0);

const formatDate = (dateString, opts = {}) =>
    new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        ...opts,
    });

// ---------------------------------------------------------------------------
// Status pill — small, quiet, used next to the order number in the header
// ---------------------------------------------------------------------------
function StatusPill({ status }) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                config.bg,
                config.text
            )}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
            {config.label}
        </span>
    );
}

// ---------------------------------------------------------------------------
// Status tracker — reads as a real progress line for the four active states;
// collapses to a single "halted" marker when the order has been cancelled.
// ---------------------------------------------------------------------------
function StatusTracker({ status }) {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-950/40">
                <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-400">Order cancelled</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70">
                        This order will not continue through fulfillment.
                    </p>
                </div>
            </div>
        );
    }

    const currentIndex = ACTIVE_FLOW.indexOf(status);

    return (
        <div className="flex items-start">
            {ACTIVE_FLOW.map((step, i) => {
                const config = STATUS_CONFIG[step];
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                const isLast = i === ACTIVE_FLOW.length - 1;

                return (
                    <div key={step} className={cn('flex items-center', !isLast && 'flex-1')}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div
                                className={cn(
                                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                                    isDone && 'border-foreground bg-foreground text-background',
                                    isCurrent && cn('border-current', config.text, config.bg),
                                    !isDone && !isCurrent && 'border-muted-foreground/25 text-muted-foreground/40'
                                )}
                            >
                                {isDone ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <span className={cn('h-2 w-2 rounded-full', isCurrent ? config.dot : 'bg-current')} />
                                )}
                            </div>
                            <span
                                className={cn(
                                    'text-[11px] font-medium whitespace-nowrap',
                                    isCurrent ? config.text : isDone ? 'text-foreground' : 'text-muted-foreground/50'
                                )}
                            >
                                {config.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                className={cn(
                                    'mx-2 mt-3.5 h-0.5 flex-1 rounded-full',
                                    i < currentIndex ? 'bg-foreground' : 'bg-muted-foreground/15'
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Loading skeleton — mirrors the real layout so the page doesn't jump on load
// ---------------------------------------------------------------------------
function OrderDetailsSkeleton() {
    return (
        <div className="space-y-6 pb-8 flex flex-col justify-center max-w-2xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-32 mt-1" />
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="w-full">
                <Skeleton className="h-10 w-full max-w-md rounded-lg" />

                {/* Customer Information Tab Content Skeleton */}
                <div className="mt-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-4 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-5 grid-cols-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-5" />
                            <div className="flex items-start gap-2.5">
                                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                                <div className="space-y-1.5">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

const OrderDetails = () => {
    const router = useRouter();
    const params = useParams();
    const orderId = params.id;

    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [copied, setCopied] = useState(false);

    // Simulate an API call to fetch the order — swap for a real fetch.
    useEffect(() => {
        // Use a timeout to avoid synchronous setState in effect
        const timer = setTimeout(() => {
            setOrder(DUMMY_ORDER);
            setSelectedStatus(DUMMY_ORDER.status);
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, [orderId]);

    const handleStatusChange = async (newStatus) => {
        if (newStatus === selectedStatus) return;

        const previousStatus = selectedStatus;
        setIsUpdating(true);
        setSelectedStatus(newStatus);

        try {
            // Simulated API call — replace with your real update request.
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setOrder((prev) => ({
                ...prev,
                status: newStatus,
                updatedAt: new Date().toISOString(),
            }));

            toast.success(`Order marked as ${STATUS_CONFIG[newStatus].label.toLowerCase()}`);
        } catch (error) {
            setSelectedStatus(previousStatus);
            toast.error('Could not update order status. Please try again.');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCopyOrderNumber = async () => {
        if (!order) return;
        try {
            await navigator.clipboard.writeText(order.orderNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error('Could not copy order number.');
        }
    };

    if (isLoading) {
        return <OrderDetailsSkeleton />;
    }

    if (!order) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold">Order not found</h2>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        We couldn&apos;t find an order with this ID. It may have been removed, or the link may be
                        incorrect.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/orders">Back to orders</Link>
                </Button>
            </div>
        );
    }

    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="space-y-6 pb-8 flex flex-col justify-center max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => router.back()}
                        aria-label="Go back"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                                {order.orderNumber}
                            </h1>
                            <button
                                onClick={handleCopyOrderNumber}
                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Copy order number"
                            >
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            <StatusPill status={order.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Placed {formatDate(order.createdAt)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs: Customer Information / Order Information / Update Status */}
            <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
                    <TabsTrigger value="customer" className="gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Customer Information</span>
                        <span className="sm:hidden">Customer</span>
                    </TabsTrigger>
                    <TabsTrigger value="order" className="gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Order Information</span>
                        <span className="sm:hidden">Order</span>
                    </TabsTrigger>
                    <TabsTrigger value="status" className="gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Update Status</span>
                        <span className="sm:hidden">Status</span>
                    </TabsTrigger>
                </TabsList>

                {/* Customer Information */}
                <TabsContent value="customer" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Customer details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-5 grid-cols-2">
                                <div className="flex items-start gap-2.5">
                                    <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Full name</p>
                                        <p className="text-sm font-medium">{order.customer.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm font-medium">{order.customer.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Telegram chat ID</p>
                                        <p className="text-sm font-medium">{order.customer.telegramChatId}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{order.customer.email || '—'}</p>
                                    </div>
                                </div>
                            </div>

                            {order.shippingAddress && (
                                <>
                                    <Separator className="my-5" />
                                    <div className="flex items-start gap-2.5">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Shipping address</p>
                                            <p className="text-sm font-medium leading-relaxed">
                                                {order.shippingAddress.street}
                                                <br />
                                                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                                {order.shippingAddress.zipCode}
                                                <br />
                                                {order.shippingAddress.country}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Order Information */}
                <TabsContent value="order" className="mt-4 space-y-6">
                    <Card className="overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                <span>{totalItems} total Items</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-14"></TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Qty</TableHead>
                                            <TableHead className="text-right">Unit price</TableHead>
                                            <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell>
                                                    <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted">
                                                        <Image
                                                            src={item.productImage}
                                                            alt={item.productName}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm font-medium">
                                                    {item.productName}
                                                </TableCell>
                                                <TableCell className="text-center text-sm text-muted-foreground">
                                                    {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">
                                                    {currency(item.unitPrice)}
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-medium">
                                                    {currency(item.subtotal)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <div className='w-full'>
                                <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                                    <Receipt className="h-3.5 w-3.5" />
                                    <h1>Order Summary</h1>
                                </div>
                                <div className="space-y-3 mt-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span>{currency(order.subtotal)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span>{currency(order.tax)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span>{currency(order.shipping)}</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-sm font-medium">Total</span>
                                        <span className="text-xl font-semibold tabular-nums">
                                            {currency(order.total)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        Created {formatDate(order.createdAt)}
                                    </div>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Update Status */}
                <TabsContent value="status" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Fulfillment progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <StatusTracker status={order.status} />

                            <Separator />

                            <div className="max-w-sm space-y-3">
                                <div>
                                    <p className="text-sm font-medium">Change status</p>
                                    <p className="text-xs text-muted-foreground">
                                        Updating this notifies the customer and logs the change.
                                    </p>
                                </div>
                                <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={isUpdating}>
                                    <SelectTrigger className="w-35">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Status</SelectLabel>
                                            {STATUS_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={cn(
                                                                'h-1.5 w-1.5 rounded-full',
                                                                STATUS_CONFIG[option.value].dot
                                                            )}
                                                        />
                                                        {option.label}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {isUpdating ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving change…
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Circle className="h-2 w-2 fill-current text-muted-foreground/40" />
                                        Last updated {formatDate(order.updatedAt)}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrderDetails;
