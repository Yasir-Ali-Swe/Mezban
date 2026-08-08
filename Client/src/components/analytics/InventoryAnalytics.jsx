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
    // Calculate summary statistics
    const totalItems = data?.items?.length || 0;
    const lowStock = data?.items?.filter(item => item.status === 'Low').length || 0;
    const outOfStock = data?.items?.filter(item => item.status === 'Out of Stock').length || 0;

    // Status badge configuration
    const getStatusBadge = (status) => {
        const statusConfig = {
            'Low': {
                variant: 'outline',
                className: 'border-chart-3/50 text-chart-3 bg-chart-3/10 hover:bg-chart-3/20'
            },
            'Out of Stock': {
                variant: 'destructive',
                className: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/50'
            },
            'In Stock': {
                variant: 'outline',
                className: 'border-primary/50 text-primary bg-primary/10 hover:bg-primary/20'
            }
        };

        const config = statusConfig[status] || statusConfig['Low'];
        return (
            <Badge variant={config.variant} className={config.className}>
                {status}
            </Badge>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Inventory Analytics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-2xl font-bold text-primary">{totalItems}</p>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                    </div>
                    <div className="text-center p-3 bg-chart-3/10 rounded-lg border border-chart-3/20">
                        <p className="text-2xl font-bold text-chart-3">{lowStock}</p>
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                    </div>
                    <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                        <p className="text-2xl font-bold text-destructive">{outOfStock}</p>
                        <p className="text-xs text-muted-foreground">Out of Stock</p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead className="text-center">Stock</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data?.items?.map((item, index) => (
                                <TableRow key={item.id || index}>
                                    <TableCell className="font-medium text-sm">
                                        {item.name}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {item.stock}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(item.status)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default InventoryAnalytics;