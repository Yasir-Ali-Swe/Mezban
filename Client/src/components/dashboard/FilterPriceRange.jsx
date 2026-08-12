import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * FilterPriceRange
 *
 * The min/max price input pair used on the Products and Menu list pages.
 *
 * @param {string}   minValue
 * @param {string}   maxValue
 * @param {Function} onMinChange  - called with the new min value string
 * @param {Function} onMaxChange  - called with the new max value string
 * @param {string}   [minPlaceholder]
 * @param {string}   [maxPlaceholder]
 * @param {string}   [className]  - classes for the wrapping div
 * @param {string}   [inputClassName] - classes for each Input (in addition to defaults)
 */
const FilterPriceRange = ({
    minValue,
    maxValue,
    onMinChange,
    onMaxChange,
    minPlaceholder = 'Min Price',
    maxPlaceholder = 'Max Price',
    className,
    inputClassName,
}) => {
    return (
        <div className={cn('flex items-center gap-2 shrink-0', className)}>
            <Input
                type="number"
                placeholder={minPlaceholder}
                value={minValue}
                onChange={(e) => onMinChange(e.target.value)}
                className={cn('h-8 sm:h-9 text-xs sm:text-sm w-24 sm:w-28', inputClassName)}
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
                type="number"
                placeholder={maxPlaceholder}
                value={maxValue}
                onChange={(e) => onMaxChange(e.target.value)}
                className={cn('h-8 sm:h-9 text-xs sm:text-sm w-24 sm:w-28', inputClassName)}
            />
        </div>
    );
};

export default FilterPriceRange;
