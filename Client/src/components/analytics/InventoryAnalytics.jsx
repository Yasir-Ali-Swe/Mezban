'use client';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const InventoryAnalytics = ({ data }) => {
    // Summary statistics for Menu Items
    const totalItems = data?.total ?? (data?.items?.length || 0);
    const availableItems = data?.lowStock ?? (data?.items?.filter(item => item.status === 'In Stock' || item.status === 'Low').length || 0);
    const unavailableItems = data?.outOfStock ?? (data?.items?.filter(item => item.status === 'Out of Stock').length || 0);

    // Status badge configuration
    const getStatusBadge = (status) => {
        const statusConfig = {
            'In Stock': {
                variant: 'outline',
                className: 'border-green-500/50 text-green-700 bg-green-500/10 dark:text-green-400'
            },
            'Low': {
                variant: 'outline',
                className: 'border-chart-3/50 text-chart-3 bg-chart-3/10'
            },
            'Out of Stock': {
                variant: 'destructive',
                className: 'bg-destructive/10 text-destructive border-destructive/50'
            }
        };

        const config = statusConfig[status] || statusConfig['In Stock'];
        return (
            <Badge variant={config.variant} className={config.className}>
                {status === 'In Stock' ? 'Available' : status === 'Out of Stock' ? 'Unavailable' : status}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Menu Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-2xl font-bold text-primary">{totalItems}</p>
                        <p className="text-xs text-muted-foreground">Total Menu Items</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{availableItems}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                    </div>
                    <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <p className="text-2xl font-bold text-destructive">{unavailableItems}</p>
                        <p className="text-xs text-muted-foreground">Unavailable</p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Menu Item</TableHead>
                                <TableHead className="text-center">Selling Price</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(!data?.items || data.items.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                                        No menu items found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.items.map((item, index) => (
                                    <TableRow key={item.id || index}>
                                        <TableCell className="font-medium text-sm">
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-xs">
                                            {item.stock}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {getStatusBadge(item.status)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default InventoryAnalytics;