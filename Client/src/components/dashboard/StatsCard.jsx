import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * StatsCard
 *
 * The responsive stat card used at the top of every list page.
 * Preserves the exact responsive classes already used in every page:
 *   - text-xs sm:text-sm on the title
 *   - h-3.5 w-3.5 sm:h-4 sm:w-4 on the icon
 *   - text-lg sm:text-2xl font-bold on the value
 *   - text-[10px] sm:text-xs text-muted-foreground on the caption
 *
 * @param {string}      title
 * @param {*}           value           - number or string to display
 * @param {Component}   icon            - Lucide icon component
 * @param {string}      [iconClassName] - extra classes for the icon (e.g. "text-primary")
 * @param {string}      [valueClassName]- extra classes for the value (e.g. "text-destructive")
 * @param {string}      [caption]       - small text below the value
 */
const StatsCard = ({
    title,
    value,
    icon: Icon,
    iconClassName,
    valueClassName,
    caption,
}) => {
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
                    {value}
                </div>
                {caption !== undefined && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {caption}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export default StatsCard;
