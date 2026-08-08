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

import { PieChart, Pie, Cell } from 'recharts';

const OrderStatusChart = ({ data }) => {
    // Sort by value, highest first
    const sortedData = [...data].sort(
        (a, b) => b.value - a.value
    );

    // Shadcn chart colors
    const chartColors = [
        'var(--chart-1)',
        'var(--chart-2)',
        'var(--chart-3)',
        'var(--chart-4)',
        'var(--chart-5)',
    ];

    // Chart configuration
    const chartConfig = {};

    sortedData.forEach((item, index) => {
        chartConfig[item.name] = {
            label: item.name,
            color: chartColors[index % chartColors.length],
        };
    });

    // Calculate total
    const total = sortedData.reduce(
        (sum, item) => sum + Number(item.value),
        0
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Order Status
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="h-72">
                    <ChartContainer
                        config={chartConfig}
                        className="h-full w-full"
                    >
                        <PieChart>
                            <Pie
                                data={sortedData}
                                cx="50%"
                                cy="42%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                            >
                                {sortedData.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            chartColors[
                                            index %
                                            chartColors.length
                                            ]
                                        }
                                    />
                                ))}
                            </Pie>

                            {/* Center text */}
                            <text
                                x="50%"
                                y="42%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground text-xl font-bold"
                            >
                                {total}
                            </text>

                            {/* Tooltip */}
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        indicator="dot"
                                        formatter={(
                                            value,
                                            name,
                                            item
                                        ) => {
                                            const index =
                                                sortedData.findIndex(
                                                    (entry) =>
                                                        entry.name ===
                                                        item.payload.name
                                                );

                                            return (
                                                <span className="flex items-center gap-2">
                                                    <span
                                                        className="h-2 w-2 shrink-0 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                chartColors[
                                                                index %
                                                                chartColors.length
                                                                ],
                                                        }}
                                                    />

                                                    <span>
                                                        {name}: {value}
                                                    </span>
                                                </span>
                                            );
                                        }}
                                    />
                                }
                            />

                            {/* Custom Legend */}
                            <foreignObject
                                x="0"
                                y="82%"
                                width="100%"
                                height="18%"
                            >
                                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2">
                                    {sortedData.map(
                                        (entry, index) => (
                                            <div
                                                key={entry.name}
                                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                            >
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            chartColors[
                                                            index %
                                                            chartColors.length
                                                            ],
                                                    }}
                                                />

                                                <span>
                                                    {entry.name}
                                                </span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </foreignObject>
                        </PieChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default OrderStatusChart;