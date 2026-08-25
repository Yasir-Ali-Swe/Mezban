'use client';

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
    Gift,
    Users,
    Eye,
    AlertTriangle,
    PackagePlus,
    ShoppingBag,
} from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useDashboardStats } from '@/hooks/useApi';

const QUICK_ACTIONS = [
    { icon: PackagePlus, label: 'Add Menu Item', href: '/menu/new' },
    { icon: Gift, label: 'Add Deal', href: '/deals/new' },
    { icon: ShoppingBag, label: 'View Orders', href: '/orders' },
    { icon: Users, label: 'View Customers', href: '/customers' },
];

const RestaurantDashboard = () => {
    const { data: responseData, isLoading } = useDashboardStats();
    const statsData = responseData?.data?.stats || { todayOrders: 0, todayRevenue: 0, activeDeals: 0 };
    const recentOrdersData = responseData?.data?.recentOrders || [];
    const recentConversationsData = responseData?.data?.recentConversations || [];
    const alertsData = responseData?.data?.alerts || [];

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Overview of your restaurant
                </p>
            </div>

            {/* Stats Cards - Using StatCard */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Today's Orders"
                    value={statsData.todayOrders}
                    icon={ShoppingCart}
                    iconClassName={"text-chart-1"}
                    valueClassName={"text-chart-1"}
                    type="number"
                />
                <StatCard
                    title="Today's Revenue"
                    value={statsData.todayRevenue}
                    icon={DollarSign}
                    iconClassName={"text-chart-2"}
                    valueClassName={"text-chart-2"}
                    type="currency"
                />
                <StatCard
                    title="Active Deals"
                    value={statsData.activeDeals}
                    icon={Gift}
                    valueClassName="text-chart-3"
                    iconClassName={"text-chart-3"}
                    caption="Marketing overview"
                />
            </div>

            {/* Recent Orders & Quick Actions - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders - Takes 2/3 of the space */}
                <Card className="lg:col-span-2 flex flex-col order-2 lg:order-1">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
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
                                    {
                                        recentOrdersData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <span className="text-muted-foreground text-sm">No recent orders</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : recentOrdersData.map((order) => (
                                            <TableRow key={order._id || order.id}>
                                                <TableCell className="font-mono text-xs font-medium">
                                                    {order.id}
                                                </TableCell>
                                                <TableCell>{order.customer}</TableCell>
                                                <TableCell className="text-center">{order.items}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(order.total)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <StatusBadge status={order.status} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <Link href={`/orders/${order._id || order.id}`}>
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    }
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
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/conversations">View All</Link>
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
                                    {recentConversationsData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8">
                                                <span className="text-muted-foreground text-sm">No recent conversations</span>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentConversationsData.map((conv, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{conv.customer}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground truncate max-w-32">
                                                    {conv.lastMessage}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <StatusBadge status="intent" label={conv.agent} />
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {formatDate(conv.time)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                        <Link href="/conversations">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
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
                        {alertsData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
                                No system alerts at this time.
                            </div>
                        ) : (
                            alertsData.map((alert, index) => {
                                const content = (
                                    <div className="flex items-center gap-3 flex-1 min-w-0 overflow-hidden">
                                        <StatusBadge status={alert.priority || 'medium'} />
                                        <span className="text-sm truncate block">{alert.message}</span>
                                    </div>
                                );

                                return alert.href ? (
                                    <Link
                                        key={index}
                                        href={alert.href}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        {content}
                                    </Link>
                                ) : (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                                    >
                                        {content}
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RestaurantDashboard;