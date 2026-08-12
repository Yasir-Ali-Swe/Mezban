'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { smartFormat } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    trend = 'up',
    type = 'number',
    iconClassName,
    valueClassName,
    caption,
}) => {
    const isUp = trend === 'up';
    const TrendIcon = isUp ? ArrowUp : ArrowDown;

    // Format the value based on type
    const formattedValue = smartFormat(value, type);

    // Check if we should show trend (change must be defined)
    const showTrend = change !== undefined && change !== null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
                {Icon && (
                    <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', iconClassName ?? 'text-muted-foreground')} />
                )}
            </CardHeader>
            <CardContent>
                <div className={cn('text-lg sm:text-2xl font-bold', valueClassName)}>
                    {formattedValue}
                </div>

                {showTrend ? (
                    // Analytics style: with trend arrow and change
                    <div className="flex items-center gap-1 text-xs">
                        <TrendIcon
                            className={cn(
                                'h-3 w-3',
                                isUp ? 'text-green-600' : 'text-red-600'
                            )}
                        />
                        <span className={cn(
                            'font-medium',
                            isUp ? 'text-green-600' : 'text-red-600'
                        )}>
                            {change > 0 ? '+' : ''}{change}%
                        </span>
                        <span className="text-muted-foreground">vs previous period</span>
                    </div>
                ) : caption !== undefined ? (
                    // List page style: with caption
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {caption}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );
};

export default StatCard;