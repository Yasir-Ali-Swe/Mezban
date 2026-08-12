import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * DataTable
 *
 * Column-config-driven table wrapper that preserves the exact outer shell
 * used on every list page:
 *   border rounded-xl overflow-hidden bg-card
 *   overflow-x-auto scrollbar-thin lg:scrollbar-hide
 *
 * ─── Column definition ─────────────────────────────────────────────────────
 * {
 *   key: string,              // unique key (used as React key)
 *   header: string,           // column header text
 *   headerClassName?: string, // classes for <TableHead>
 *   cellClassName?: string,   // classes for <TableCell>
 *   render: (row) => ReactNode // cell renderer
 * }
 *
 * ─── Props ─────────────────────────────────────────────────────────────────
 * @param {Object[]}  columns
 * @param {Object[]}  data               - array of row objects
 * @param {Function}  getRowKey          - (row) => string | number
 * @param {string}    [emptyMessage]     - text shown when data is empty
 * @param {number}    [emptyColSpan]     - colSpan for the empty state row
 * @param {string}    [tableMinWidth]    - min-width class on <Table> (e.g. "min-w-[900px]")
 * @param {Function}  [onRowClick]       - (row) => void; makes the row clickable
 * @param {Function}  [rowClassName]     - (row) => string; conditional row classes
 * @param {ReactNode} [footer]           - content rendered below the scrollable area,
 *                                         inside the card shell (typically <PaginationFooter>)
 */
const DataTable = ({
    columns,
    data,
    getRowKey,
    emptyMessage = 'No results found.',
    emptyColSpan,
    tableMinWidth = 'min-w-[900px]',
    onRowClick,
    rowClassName,
    footer,
}) => {
    const colCount = emptyColSpan ?? columns.length;

    return (
        <div className="border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto scrollbar-thin lg:scrollbar-hide">
                <Table className={tableMinWidth}>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key} className={col.headerClassName}>
                                    {col.header}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={colCount}
                                    className="text-center py-8 text-muted-foreground text-xs"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow
                                    key={getRowKey(row)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                    className={cn(
                                        onRowClick && 'cursor-pointer hover:bg-muted/50 transition-colors',
                                        rowClassName ? rowClassName(row) : undefined
                                    )}
                                >
                                    {columns.map((col) => (
                                        <TableCell key={col.key} className={col.cellClassName}>
                                            {col.render(row)}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Footer slot: PaginationFooter renders here, inside the card border */}
            {footer}
        </div>
    );
};

export default DataTable;
