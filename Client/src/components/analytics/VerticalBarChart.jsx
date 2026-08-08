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
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import {
    getResponsiveMargins,
    getResponsiveGap
} from '@/lib/chartUtils';

const VerticalBarChart = ({
    title,
    data,
    valueKey = 'value',
    nameKey = 'name',
    color = 'var(--chart-1)',
    formatter = null,
    valueFormatter = null,
    isTimeSeries = false,
    timeRange = 'weekly'
}) => {
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
        [valueKey]: {
            label: title || valueKey,
            color: color
        }
    };

    const defaultFormatter = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
        }
        return value.toLocaleString();
    };

    const yAxisFormatter = (value) => {
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}M`;
        }
        if (value >= 1000) {
            return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
        }
        return value.toString();
    };

    const tooltipFormatter = formatter || defaultFormatter;

    const numBars = data?.length || 0;
    const margins = getResponsiveMargins(screenWidth);
    const barCategoryGap = getResponsiveGap(numBars, screenWidth);

    // Get label interval based on screen width and number of bars
    const getLabelInterval = () => {
        return 0; // Show all labels on desktop
    };

    const getFontSize = () => {
        if (isMobile) return 10;
        if (isTablet) return 11;
        return 12;
    };

    const getChartMinWidth = () => {
        if (numBars <= 5) return '500px';
        if (numBars <= 7) return '600px';
        if (numBars <= 12) return '750px';
        return '900px';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-56 sm:h-60 lg:h-64 w-full overflow-x-auto chart-scrollbar-hidden lg:overflow-x-visible">
                    <div
                        className="h-full"
                        style={{
                            minWidth: `${getChartMinWidth()}`,
                        }}
                    >

                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <BarChart
                                data={data}
                                margin={margins}
                                barCategoryGap={barCategoryGap}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    strokeDasharray="3 3"
                                    className="stroke-muted"
                                />
                                <XAxis
                                    dataKey={nameKey}
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
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={isMobile ? 4 : 8}
                                    tickFormatter={valueFormatter || yAxisFormatter}
                                    fontSize={getFontSize()}
                                    width={isMobile ? 35 : 50}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={tooltipFormatter}
                                        />
                                    }
                                />
                                <Bar
                                    dataKey={valueKey}
                                    fill={`var(--color-${valueKey})`}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default VerticalBarChart;