import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * FilterSearchInput
 *
 * The search input with a leading Search icon used across all list pages.
 *
 * @param {string}   placeholder  - input placeholder text
 * @param {string}   value        - controlled value
 * @param {Function} onChange     - called with (filterKey, value); filterKey defaults to 'search'
 * @param {string}   [filterKey]  - the filter key to pass back to onChange (default: 'search')
 * @param {string}   [className]  - extra classes for the wrapping div
 * @param {string}   [inputClassName] - extra classes for the Input itself
 */
const FilterSearchInput = ({
    placeholder = 'Search...',
    value,
    onChange,
    filterKey = 'search',
    className,
    inputClassName,
}) => {
    return (
        <div className={cn('relative', className)}>
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(filterKey, e.target.value)}
                className={cn('pl-8 h-8 sm:h-9 text-xs sm:text-sm', inputClassName)}
            />
        </div>
    );
};

export default FilterSearchInput;
