// src/components/dashboard/FilterDateRange.jsx
'use client';

import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const FilterDateRange = ({
    dateFrom,
    dateTo,
    onApply,
    onClear,
    label = 'Date Range',
    className,
    contentClassName = 'sm:max-w-[425px]',
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [tempDateFrom, setTempDateFrom] = useState(dateFrom);
    const [tempDateTo, setTempDateTo] = useState(dateTo);

    // Format the display label for the trigger button
    const getDisplayLabel = () => {
        if (dateFrom && dateTo) {
            const fromDate = new Date(dateFrom).toLocaleDateString();
            const toDate = new Date(dateTo).toLocaleDateString();
            return `${fromDate} - ${toDate}`;
        }
        if (dateFrom) {
            return `From ${new Date(dateFrom).toLocaleDateString()}`;
        }
        if (dateTo) {
            return `To ${new Date(dateTo).toLocaleDateString()}`;
        }
        return label;
    };

    const handleDialogOpenChange = (open) => {
        setIsDialogOpen(open);
        if (open) {
            // Reset temp state to current filter values when opening
            setTempDateFrom(dateFrom);
            setTempDateTo(dateTo);
        }
    };

    const handleApply = () => {
        onApply(tempDateFrom, tempDateTo);
        setIsDialogOpen(false);
    };

    const handleClear = () => {
        setTempDateFrom('');
        setTempDateTo('');
        onClear();
        setIsDialogOpen(false);
    };

    const hasDateRange = dateFrom || dateTo;

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger render={
                <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                        'h-8 sm:h-9 text-xs sm:text-sm gap-1 min-w-[100px] shrink-0',
                        hasDateRange && 'border-primary/50',
                        className
                    )}
                >
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span className={cn(
                        'truncate max-w-[120px] sm:max-w-[180px]',
                        hasDateRange && 'text-primary font-medium'
                    )}>
                        {getDisplayLabel()}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 ml-auto" />
                </Button>
            } />

            <DialogContent className={contentClassName}>
                <DialogHeader>
                    <DialogTitle>Date Range</DialogTitle>
                    <DialogDescription>
                        Select a date range to filter results.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label htmlFor="dateFrom" className="text-sm font-medium">
                            From
                        </label>
                        <Input
                            id="dateFrom"
                            type="date"
                            value={tempDateFrom}
                            onChange={(e) => setTempDateFrom(e.target.value)}
                            className="h-10 text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="dateTo" className="text-sm font-medium">
                            To
                        </label>
                        <Input
                            id="dateTo"
                            type="date"
                            value={tempDateTo}
                            onChange={(e) => setTempDateTo(e.target.value)}
                            className="h-10 text-sm"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        className="text-xs sm:text-sm"
                    >
                        Clear
                    </Button>
                    <Button
                        onClick={handleApply}
                        className="text-xs sm:text-sm"
                    >
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default FilterDateRange;