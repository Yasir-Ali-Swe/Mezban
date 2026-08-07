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
    ShoppingCart,
    DollarSign,
    Clock,
    Utensils,
    Plus,
    Gift,
    Users,
    Eye,
    AlertTriangle,
    PackagePlus,
    Tag,
    ShoppingBag,
    UserPlus,
    TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dummy data
const DUMMY_STATS = {
    todayOrders: 18,
    todayRevenue: 32800,
    activeDeals: 12,
    lowStockItems: 8,
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
    { type: 'low_stock', message: 'Menu item "Zinger Burger" is running low (3 items left)', priority: 'high' },
    { type: 'low_stock', message: 'Menu item "French Fries" is running low (5 items left)', priority: 'medium' },
    { type: 'expiring_deal', message: 'Deal "Family Feast" expires in 2 days', priority: 'high' },
    { type: 'expiring_deal', message: 'Deal "Student Special" expires in 5 days', priority: 'medium' },
    { type: 'low_stock', message: 'Menu item "Chicken Wings" is running low (2 items left)', priority: 'high' },
];

const QUICK_ACTIONS = [
    { icon: PackagePlus, label: 'Add Menu Item', href: '/menu/new' },
    { icon: Gift, label: 'Add Deal', href: '/deals/new' },
    { icon: ShoppingBag, label: 'View Orders', href: '/orders' },
    { icon: Users, label: 'View Customers', href: '/customers' },
];

const getStatusBadge = (status) => {
    const variants = {
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return variants[status] || 'bg-gray-100 text-gray-800';
};

const getAlertPriority = (priority) => {
    const variants = {
        high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };
    return variants[priority] || 'bg-gray-100 text-gray-800';
};

const RestaurantDashboard = () => {
    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of your restaurant
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{DUMMY_STATS.todayOrders}</div>
                        <p className="text-xs text-muted-foreground">+15% from yesterday</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Rs. {DUMMY_STATS.todayRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">+10% from yesterday</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                        <Gift className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{DUMMY_STATS.activeDeals}</div>
                        <p className="text-xs text-muted-foreground">Marketing overview</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <Utensils className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{DUMMY_STATS.lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">Need restocking</p>
                    </CardContent>
                </Card>
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
                                                <Badge className={cn("text-[10px]", getStatusBadge(order.status))}>
                                                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                                </Badge>
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
                                                <Badge variant="outline" className="text-[10px]">
                                                    {conv.agent}
                                                </Badge>
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
                                    <Badge className={cn("text-[10px] shrink-0", getAlertPriority(alert.priority))}>
                                        {alert.priority}
                                    </Badge>
                                    <span className="text-sm truncate">{alert.message}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 ml-2">
                                    <Link href="/menu">View</Link>
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RestaurantDashboard;