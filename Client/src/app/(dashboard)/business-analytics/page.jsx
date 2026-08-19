'use client';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BarChart3 } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import RevenueOrdersChart from '@/components/analytics/RevenueOrdersChart';
import OrderStatusChart from '@/components/analytics/OrderStatusChart';
import VerticalBarChart from '@/components/analytics/VerticalBarChart';
import InventoryAnalytics from '@/components/analytics/InventoryAnalytics';
import { useBusinessAnalytics } from '@/hooks/useApi';
import { formatNumber, formatCurrency } from '@/lib/formatters';
import { getTimeSeriesData } from '@/lib/chartUtils';
import { Loader2, DollarSign, ShoppingCart, ShoppingBag, Layers } from 'lucide-react';

// Helper function to format large numbers
const formatLargeNumber = (value) => formatCurrency(value);

// Helper function for Y-axis formatting (without Rs. prefix)
const formatYAxisValue = (value) => formatNumber(value);

const BusinessAnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const { data: responseData, isLoading } = useBusinessAnalytics(timeRange);

    const currentData = responseData?.data || {
        overview: { revenue: 0, revenueChange: 0, orders: 0, ordersChange: 0, avgOrderValue: 0, avgOrderChange: 0, unitsSold: 0, unitsChange: 0 },
        revenueOrders: [],
        orderStatus: [],
        topProducts: [],
        categoryPerformance: [],
        dealPerformance: [],
        inventory: { total: 0, lowStock: 0, outOfStock: 0, items: [] },
    };

    // Prepare time-series data with aggregation
    const revenueOrdersData = getTimeSeriesData(
        currentData.revenueOrders || [],
        timeRange,
        ['revenue', 'orders']
    );

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Business Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Track sales, orders, menu items, and kitchen status.
                    </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Select Range</span>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-24 sm:w-28 text-sm">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Time Range</SelectLabel>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={currentData.overview?.revenue || 0}
                    change={currentData.overview?.revenueChange || 0}
                    icon={DollarSign}
                    iconClassName={"text-chart-1"}
                    trend={(currentData.overview?.revenueChange || 0) >= 0 ? "up" : "down"}
                    type="currency"
                />
                <StatCard
                    title="Total Orders"
                    value={currentData.overview?.orders || 0}
                    change={currentData.overview?.ordersChange || 0}
                    icon={ShoppingCart}
                    iconClassName={"text-chart-2"}
                    trend={(currentData.overview?.ordersChange || 0) >= 0 ? "up" : "down"}
                    type="number"
                />
                <StatCard
                    title="Average Order Value"
                    value={currentData.overview?.avgOrderValue || 0}
                    change={currentData.overview?.avgOrderChange || 0}
                    icon={ShoppingBag}
                    iconClassName={"text-chart-3"}
                    trend={(currentData.overview?.avgOrderChange || 0) >= 0 ? "up" : "down"}
                    type="currency"
                />
                <StatCard
                    title="Units Sold"
                    value={currentData.overview?.unitsSold || 0}
                    change={currentData.overview?.unitsChange || 0}
                    icon={Layers}
                    iconClassName={"text-chart-4"}
                    trend={(currentData.overview?.unitsChange || 0) >= 0 ? "up" : "down"}
                    type="number"
                />
            </div>

            {/* Revenue vs Orders Chart */}
            <RevenueOrdersChart
                data={revenueOrdersData}
                timeRange={timeRange}
            />

            {/* Order Status & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrderStatusChart data={currentData.orderStatus || []} />
                <VerticalBarChart
                    title="Top Menu Items"
                    data={currentData.topProducts || []}
                    color="var(--chart-3)"
                    isTimeSeries={false}
                />
            </div>

            {/* Category Performance & Deal Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VerticalBarChart
                    title="Category Performance"
                    data={currentData.categoryPerformance || []}
                    color="var(--chart-4)"
                    formatter={formatLargeNumber}
                    valueFormatter={formatYAxisValue}
                    isTimeSeries={false}
                />
                <VerticalBarChart
                    title="Deal Performance"
                    data={currentData.dealPerformance || []}
                    color="var(--chart-5)"
                    isTimeSeries={false}
                />
            </div>

            {/* Inventory / Menu Analytics */}
            <InventoryAnalytics data={currentData.inventory} />
        </div>
    );
};

export default BusinessAnalyticsPage;