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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import {
    getResponsiveMargins,
    getResponsiveGap,
    getChartMinWidth
} from '@/lib/chartUtils';

const AiVsManualChart = ({ data, timeRange = 'weekly' }) => {
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
        manual: {
            label: 'Manual',
            color: 'var(--chart-2)'
        },
        ai: {
            label: 'AI',
            color: 'var(--chart-1)'
        }
    };

    const numBars = data?.length || 0;
    const margins = getResponsiveMargins(screenWidth);
    const barCategoryGap = getResponsiveGap(numBars, screenWidth);

    // Below `lg` this returns a fixed px width so many bars stay readable
    // via horizontal scroll. At `lg` and up it returns '100%', so the
    // chart always fits its Card exactly -- nothing to clip on the right.
    const chartMinWidth = getChartMinWidth(numBars, screenWidth, {
        small: 600,
        medium: 600,
        large: 750,
        xlarge: 900,
    });

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
                <CardTitle className="text-sm font-medium">AI vs Manual Orders</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-56 sm:h-60 lg:h-64 w-full overflow-x-auto chart-scrollbar-hidden">
                    <div
                        className="h-full"
                        style={{
                            minWidth: chartMinWidth,
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
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={isMobile ? 4 : 8}
                                    fontSize={getFontSize()}
                                    width={isMobile ? 35 : 50}
                                />
                                <ChartTooltip
                                    content={<ChartTooltipContent />}
                                />
                                <ChartLegend
                                    content={<ChartLegendContent />}
                                />
                                <Bar
                                    dataKey="manual"
                                    fill="var(--color-manual)"
                                    radius={[4, 4, 0, 0]}
                                    name="Manual"
                                />
                                <Bar
                                    dataKey="ai"
                                    fill="var(--color-ai)"
                                    radius={[4, 4, 0, 0]}
                                    name="AI"
                                />
                            </BarChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default AiVsManualChart;