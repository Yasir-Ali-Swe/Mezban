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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useState, useEffect } from 'react';
import { getResponsiveMargins, getChartMinWidth } from '@/lib/chartUtils';

const ConversationVolumeChart = ({ data, timeRange = 'weekly' }) => {
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
        conversations: {
            label: 'Conversations',
            color: 'var(--chart-1)'
        }
    };

    const numBars = data?.length || 0;
    const margins = getResponsiveMargins(screenWidth);

    // Below `lg` this returns a fixed px width so many points stay
    // readable via horizontal scroll. At `lg` and up it returns '100%',
    // so the chart always fits its Card exactly -- nothing to clip.
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
                <CardTitle className="text-sm font-medium">Conversation Volume</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-56 sm:h-60 lg:h-70 w-full overflow-x-auto chart-scrollbar-hidden">
                    <div
                        className="h-full"
                        style={{
                            minWidth: chartMinWidth,
                        }}
                    >
                        <ChartContainer config={chartConfig} className="h-full w-full">
                            <AreaChart
                                data={data}
                                margin={margins}
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
                                <Area
                                    type="monotone"
                                    dataKey="conversations"
                                    stroke="var(--color-conversations)"
                                    fill="var(--color-conversations)"
                                    fillOpacity={0.2}
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ConversationVolumeChart;