import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * FilterDropdown
 *
 * A generic DropdownMenu-based filter/sort control used across all list pages.
 * Supports both single-group and multi-group menus (e.g. Sort By + Order direction).
 *
 * ─── Single-group usage (category, status, availability) ────────────────────
 * <FilterDropdown
 *     label="Category"
 *     value={filters.category}
 *     options={[{ value: 'all', label: 'All' }, { value: 'Electronics', label: 'Electronics' }]}
 *     onSelect={(v) => updateFilter('category', v)}
 *     menuLabel="Category"
 * />
 *
 * ─── Multi-group usage (Sort By + Order) ────────────────────────────────────
 * <FilterDropdown
 *     label="Sort"
 *     getCurrentLabel={() => SORT_OPTIONS.find(s => s.value === filters.sortBy)?.label ?? 'Date'}
 *     groups={[
 *         {
 *             label: 'Sort By',
 *             options: SORT_OPTIONS,
 *             onSelect: (v) => updateFilter('sortBy', v),
 *         },
 *         {
 *             label: 'Order',
 *             options: [{ value: 'asc', label: 'Ascending' }, { value: 'desc', label: 'Descending' }],
 *             onSelect: (v) => updateFilter('order', v),
 *         },
 *     ]}
 * />
 *
 * @param {string}      label           - prefix text in the trigger button (e.g. "Category")
 * @param {string}      [value]         - currently selected value (for single-group)
 * @param {Function}    [getCurrentLabel] - override to compute trigger label; receives nothing
 * @param {Component}   [icon]          - Lucide icon; defaults to Filter
 * @param {{ value, label }[]} [options] - flat options list for single-group menus
 * @param {Function}    [onSelect]      - called with selected value for single-group
 * @param {string}      [menuLabel]     - DropdownMenuLabel text for single-group
 * @param {{ label, options, onSelect }[]} [groups] - for multi-group menus (Sort)
 * @param {string}      [contentWidth]  - width class for the content panel (default "w-40")
 * @param {string}      [className]     - extra classes on the trigger Button
 */
const FilterDropdown = ({
    label,
    value,
    getCurrentLabel,
    icon: Icon = Filter,
    options,
    onSelect,
    menuLabel,
    groups,
    contentWidth = 'w-40',
    className,
}) => {
    // Compute the display label in the trigger
    const displayLabel = getCurrentLabel
        ? getCurrentLabel()
        : (value === 'all' || !value)
            ? label
            : `${label}: ${value}`;

    const isMultiGroup = Array.isArray(groups) && groups.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={
                <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-8 sm:h-9 text-xs sm:text-sm gap-1 whitespace-nowrap shrink-0', className)}
                >
                    <Icon className="h-3.5 w-3.5" />
                    {displayLabel}
                    <ChevronDown className="h-3.5 w-3.5" />
                </Button>
            } />

            <DropdownMenuContent align="start" className={contentWidth}>
                {isMultiGroup ? (
                    // Multi-group menu (e.g. Sort By + Order)
                    groups.map((group, groupIndex) => (
                        <div key={groupIndex}>
                            {groupIndex > 0 && <DropdownMenuSeparator />}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {group.options.map((opt) => (
                                    <DropdownMenuItem
                                        key={opt.value}
                                        onClick={() => group.onSelect(opt.value)}
                                    >
                                        {opt.icon && <opt.icon className="mr-2 h-3.5 w-3.5" />}
                                        {opt.label}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                        </div>
                    ))
                ) : (
                    // Single-group menu
                    <DropdownMenuGroup>
                        {menuLabel && (
                            <>
                                <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        {(options ?? []).map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onSelect(opt.value)}
                            >
                                {opt.icon && <opt.icon className="mr-2 h-3.5 w-3.5" />}
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default FilterDropdown;
