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
import StatCard from '@/components/analytics/StatCard';
import RevenueOrdersChart from '@/components/analytics/RevenueOrdersChart';
import OrderStatusChart from '@/components/analytics/OrderStatusChart';
import VerticalBarChart from '@/components/analytics/VerticalBarChart';
import InventoryAnalytics from '@/components/analytics/InventoryAnalytics';
import { getAnalyticsData } from '@/lib/analyticsData';
import { getTimeSeriesData } from '@/lib/chartUtils';

// Helper function to format large numbers
const formatLargeNumber = (value) => {
    if (value >= 1000000) {
        return `Rs. ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `Rs. ${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return `Rs. ${value.toLocaleString()}`;
};

// Helper function for Y-axis formatting (without Rs. prefix)
const formatYAxisValue = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toString();
};

const BusinessAnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const currentData = getAnalyticsData(timeRange);

    // Prepare time-series data with aggregation
    const revenueOrdersData = getTimeSeriesData(
        currentData.revenueOrders,
        timeRange,
        ['revenue', 'orders']
    );

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Business Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        Track sales, orders, products, and inventory.
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
                    value={currentData.overview.revenue}
                    change={currentData.overview.revenueChange}
                    icon={BarChart3}
                    trend="up"
                    type="currency"
                />
                <StatCard
                    title="Total Orders"
                    value={currentData.overview.orders}
                    change={currentData.overview.ordersChange}
                    icon={BarChart3}
                    trend="up"
                    type="number"
                />
                <StatCard
                    title="Average Order Value"
                    value={currentData.overview.avgOrderValue}
                    change={currentData.overview.avgOrderChange}
                    icon={BarChart3}
                    trend="up"
                    type="currency"
                />
                <StatCard
                    title="Units Sold"
                    value={currentData.overview.unitsSold}
                    change={currentData.overview.unitsChange}
                    icon={BarChart3}
                    trend="up"
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
                <OrderStatusChart data={currentData.orderStatus} />
                <VerticalBarChart
                    title="Top Products"
                    data={currentData.topProducts}
                    color="var(--chart-3)"
                    isTimeSeries={false}
                />
            </div>

            {/* Category Performance & Deal Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VerticalBarChart
                    title="Category Performance"
                    data={currentData.categoryPerformance}
                    color="var(--chart-4)"
                    formatter={formatLargeNumber}
                    valueFormatter={formatYAxisValue}
                    isTimeSeries={false}
                />
                <VerticalBarChart
                    title="Deal Performance"
                    data={currentData.dealPerformance}
                    color="var(--chart-5)"
                    isTimeSeries={false}
                />
            </div>

            {/* Inventory Analytics */}
            <InventoryAnalytics data={currentData.inventory} />
        </div>
    );
};

export default BusinessAnalyticsPage;