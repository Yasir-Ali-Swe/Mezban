'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import { getResponsiveMargins } from '@/lib/chartUtils';

const RevenueOrdersChart = ({ data, timeRange = 'weekly' }) => {
    const [screenWidth, setScreenWidth] = useState(1024);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = screenWidth < 640;
    const isTablet = screenWidth >= 640 && screenWidth < 1024;

    const chartConfig = {
        orders: {
            label: 'Orders',
            color: 'var(--chart-1)'
        },
        revenue: {
            label: 'Revenue (Rs.)',
            color: 'var(--chart-3)'
        }
    };

    const numBars = data?.length || 0;
    const margins = getResponsiveMargins(screenWidth);
    const getChartMinWidth = () => {
        if (numBars <= 7) return 650;
        if (numBars <= 12) return 800;
        return 950;
    };
    const getLabelInterval = () => {
        return 0;
    };



    const getFontSize = () => {
        if (isMobile) return 10;
        if (isTablet) return 11;
        return 12;
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Revenue vs Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-72 sm:h-76 lg:h-80 w-full overflow-x-auto chart-scrollbar-hidden lg:overflow-x-visible">
                    <div
                        className="h-full"
                        style={{
                            minWidth: `${getChartMinWidth()}px`,
                        }}
                    >
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <ComposedChart
                                data={data}
                                margin={margins}
                                barCategoryGap="10%"
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    className="stroke-muted"
                                />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={isMobile ? 4 : 8}
                                    fontSize={getFontSize()}
                                    interval={getLabelInterval()}
                                    tick={{
                                        angle: 0,
                                        textAnchor: 'middle'
                                    }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={isMobile ? 4 : 8}
                                    fontSize={getFontSize()}
                                    width={isMobile ? 35 : 50}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={isMobile ? 4 : 8}
                                    fontSize={getFontSize()}
                                    width={isMobile ? 35 : 50}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name, item) => {
                                                const colorKey = name === 'Orders' ? 'orders' : 'revenue';
                                                const color = chartConfig[colorKey]?.color || 'var(--chart-1)';

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2 w-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: color }}
                                                        />
                                                        <span>
                                                            {name}: {name === 'Revenue (Rs.)'
                                                                ? `Rs. ${value.toLocaleString()}`
                                                                : value}
                                                        </span>
                                                    </div>
                                                );
                                            }}
                                            indicator="dot"
                                        />
                                    }
                                />
                                <ChartLegend
                                    content={<ChartLegendContent />}
                                />
                                <Bar
                                    yAxisId="left"
                                    dataKey="orders"
                                    fill="var(--color-orders)"
                                    radius={[4, 4, 0, 0]}
                                    name="Orders"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="var(--color-revenue)"
                                    strokeWidth={2}
                                    name="Revenue"
                                    dot={{ fill: 'var(--color-revenue)', strokeWidth: 2 }}
                                />
                            </ComposedChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RevenueOrdersChart;