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
import { cn, formatNumber } from '@/lib/utils';

const AgentPerformanceTable = ({ data }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">Agent Performance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead className="text-center">Conversations</TableHead>
                                <TableHead className="text-center">Resolved</TableHead>
                                <TableHead className="text-center">Resolution Rate</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((agent, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium text-sm whitespace-nowrap">{agent.agent}</TableCell>
                                    <TableCell className="text-center">{formatNumber(agent.conversations)}</TableCell>
                                    <TableCell className="text-center">{formatNumber(agent.resolved)}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            className={cn(
                                                "text-[10px]",
                                                agent.resolution >= 90
                                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                                    : agent.resolution >= 80
                                                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                            )}
                                        >
                                            {agent.resolution}%
                                        </Badge>
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

export default AgentPerformanceTable;