import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

/**
 * PaginationFooter
 *
 * The "Showing X to Y of Z results" text + Pagination control
 * used at the bottom of every list page table.
 *
 * @param {number}     page           - current page (1-indexed)
 * @param {number}     totalPages     - total number of pages
 * @param {number}     totalFiltered  - total number of filtered items
 * @param {number}     startIndex     - 0-based start index of current page slice
 * @param {number}     endIndex       - 0-based end index (exclusive) of current page slice
 * @param {Function}   onPageChange   - (page: number) => void
 * @param {Function}   getPageNums    - (totalPages: number) => (number | 'ellipsis')[]
 *                                     pass the getPageNums returned by useUrlFilters
 */
const PaginationFooter = ({
    page,
    totalPages,
    totalFiltered,
    startIndex,
    endIndex,
    onPageChange,
    getPageNums,
}) => {
    const pageNumbers = getPageNums(totalPages);

    return (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-3 sm:px-4">
            <div className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium">
                    {totalFiltered === 0 ? 0 : startIndex + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                    {Math.min(endIndex, totalFiltered)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{totalFiltered}</span>{' '}
                results
            </div>

            <Pagination className="mx-0 w-auto">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (page > 1) onPageChange(page - 1);
                            }}
                            className={cn(
                                'h-8 sm:h-9 text-xs sm:text-sm',
                                page <= 1 && 'pointer-events-none opacity-50'
                            )}
                        />
                    </PaginationItem>

                    {pageNumbers.map((p, index) => (
                        <PaginationItem key={index}>
                            {p === 'ellipsis' ? (
                                <PaginationEllipsis className="h-8 sm:h-9" />
                            ) : (
                                <PaginationLink
                                    href="#"
                                    isActive={p === page}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onPageChange(p);
                                    }}
                                    className="h-8 sm:h-9 min-w-8 sm:min-w-9 text-xs sm:text-sm"
                                >
                                    {p}
                                </PaginationLink>
                            )}
                        </PaginationItem>
                    ))}

                    <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                if (page < totalPages) onPageChange(page + 1);
                            }}
                            className={cn(
                                'h-8 sm:h-9 text-xs sm:text-sm',
                                page >= totalPages && 'pointer-events-none opacity-50'
                            )}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    );
};

export default PaginationFooter;
