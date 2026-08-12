'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ShoppingCart,
    DollarSign,
    Clock,
    Package,
    Plus,
    List,
    Users,
    Eye,
    AlertTriangle,
    PackagePlus,
    Tag,
    ShoppingBag,
    UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatCard from '@/components/shared/StatCard';

// Dummy data
const DUMMY_STATS = {
    todayOrders: 24,
    todayRevenue: 45800,
    pendingOrders: 8,
    lowStockProducts: 12,
};

const DUMMY_RECENT_ORDERS = [
    { id: 'ORD-001', customer: 'John Doe', total: 1499, status: 'completed', time: '2 min ago', items: 3 },
    { id: 'ORD-002', customer: 'Jane Smith', total: 2399, status: 'pending', time: '15 min ago', items: 5 },
    { id: 'ORD-003', customer: 'Mike Johnson', total: 799, status: 'processing', time: '45 min ago', items: 2 },
    { id: 'ORD-004', customer: 'Sarah Wilson', total: 1899, status: 'completed', time: '1 hour ago', items: 4 },
    { id: 'ORD-005', customer: 'David Brown', total: 3499, status: 'pending', time: '2 hours ago', items: 6 },
];

const DUMMY_CONVERSATIONS = [
    { customer: 'Alice', lastMessage: 'When will my order arrive?', agent: 'AI Agent', time: '5 min ago' },
    { customer: 'Bob', lastMessage: 'I want to change my address', agent: 'AI Agent', time: '20 min ago' },
    { customer: 'Charlie', lastMessage: 'Do you have this in size L?', agent: 'Human', time: '1 hour ago' },
    { customer: 'Diana', lastMessage: 'Thanks for the quick delivery!', agent: 'AI Agent', time: '2 hours ago' },
    { customer: 'Eve', lastMessage: 'Can I get a refund?', agent: 'AI Agent', time: '3 hours ago' },
];

const DUMMY_ALERTS = [
    { type: 'low_stock', message: 'Product "Wireless Headphones" is running low (3 items left)', priority: 'high' },
    { type: 'low_stock', message: 'Product "USB Cable" is running low (5 items left)', priority: 'medium' },
    { type: 'pending_order', message: 'Order #ORD-002 has been pending for 25 hours', priority: 'high' },
    { type: 'pending_order', message: 'Order #ORD-005 has been pending for 18 hours', priority: 'medium' },
    { type: 'low_stock', message: 'Product "Power Bank" is running low (2 items left)', priority: 'high' },
];

const QUICK_ACTIONS = [
    { icon: PackagePlus, label: 'Add Product', href: '/products/new' },
    { icon: Tag, label: 'Create Category', href: '/categories' },
    { icon: ShoppingBag, label: 'View Orders', href: '/orders' },
    { icon: UserPlus, label: 'Customers', href: '/customers' },
];

const EcommerceDashboard = () => {
    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of your e-commerce store
                </p>
            </div>

            {/* Stats Cards - Using StatCard with change and trend */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Orders"
                    value={DUMMY_STATS.todayOrders}
                    change={12}
                    icon={ShoppingCart}
                    trend="up"
                />
                <StatCard
                    title="Today's Revenue"
                    value={DUMMY_STATS.todayRevenue}
                    change={8}
                    icon={DollarSign}
                    trend="up"
                    type="currency"
                />
                <StatCard
                    title="Pending Orders"
                    value={DUMMY_STATS.pendingOrders}
                    change={-3}
                    icon={Clock}
                    trend="down"
                    valueClassName="text-yellow-600"
                />
                <StatCard
                    title="Low Stock Products"
                    value={DUMMY_STATS.lowStockProducts}
                    change={5}
                    icon={Package}
                    trend="up"
                    valueClassName="text-red-600"
                />
            </div>

            {/* Recent Orders & Quick Actions - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders - Takes 2/3 of the space */}
                <Card className="lg:col-span-2 flex flex-col order-2 lg:order-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                        <Button variant="ghost" size="sm">
                            <Link href="/orders">View All</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order #</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-center">Items</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {DUMMY_RECENT_ORDERS.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-mono text-xs font-medium">
                                                {order.id}
                                            </TableCell>
                                            <TableCell>{order.customer}</TableCell>
                                            <TableCell className="text-center">{order.items}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                Rs. {order.total.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <StatusBadge status={order.status} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions - Takes 1/3 of the space */}
                <Card className="flex flex-col order-1 lg:order-2">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <div className="grid grid-cols-2 gap-3 h-full">
                            {QUICK_ACTIONS.map((action, index) => (
                                <Link
                                    key={index}
                                    href={action.href}
                                    className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                >
                                    <action.icon className="h-8 w-8 text-primary" />
                                    <span className="text-xs font-medium text-center leading-tight">
                                        {action.label}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Conversations & Alerts - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Telegram Conversations */}
                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Conversations</CardTitle>
                        <Button variant="ghost" size="sm">
                            View All
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Last Message</TableHead>
                                        <TableHead>Agent</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {DUMMY_CONVERSATIONS.map((conv, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{conv.customer}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground truncate max-w-32">
                                                {conv.lastMessage}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <StatusBadge status="intent" label={conv.agent} />
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {conv.time}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Alerts */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 flex-1">
                        {DUMMY_ALERTS.map((alert, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <StatusBadge status={alert.priority} />
                                    <span className="text-sm truncate">{alert.message}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 ml-2">
                                    <Link href="/products">View</Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EcommerceDashboard;