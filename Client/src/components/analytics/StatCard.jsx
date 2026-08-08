'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { smartFormat } from '@/lib/utils';

const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    type = 'number' // 'number' | 'currency' | 'percentage'
}) => {
    const isUp = trend === 'up';
    const TrendIcon = isUp ? ArrowUp : ArrowDown;

    // Format the value based on type
    const formattedValue = smartFormat(value, type);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{formattedValue}</div>
                <div className="flex items-center gap-1 text-xs">
                    <TrendIcon
                        className={cn(
                            "h-3 w-3",
                            isUp ? 'text-green-600' : 'text-red-600'
                        )}
                    />
                    <span className={cn(
                        "font-medium",
                        isUp ? 'text-green-600' : 'text-red-600'
                    )}>
                        {change}%
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default StatCard;