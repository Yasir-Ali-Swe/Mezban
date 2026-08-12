'use client';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Bot } from 'lucide-react';
import StatCard from '@/components/shared/StatCard';
import ConversationVolumeChart from '@/components/analytics/ConversationVolumeChart';
import IntentDistributionChart from '@/components/analytics/IntentDistributionChart';
import VerticalBarChart from '@/components/analytics/VerticalBarChart';
import AiVsManualChart from '@/components/analytics/AiVsManualChart';
import AiResolutionChart from '@/components/analytics/AiResolutionChart';
import AgentPerformanceTable from '@/components/analytics/AgentPerformanceTable';
import { getAnalyticsData } from '@/lib/analyticsData';
import { getTimeSeriesData } from '@/lib/chartUtils';

// Helper function to format large numbers
const formatLargeNumber = (value) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
    }
    return value.toString();
};

const AiAnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const currentData = getAnalyticsData(timeRange);

    // Prepare time-series data with aggregation
    const conversationData = getTimeSeriesData(
        currentData.conversationVolume,
        timeRange,
        ['conversations']
    );

    const aiVsManualData = getTimeSeriesData(
        currentData.aiVsManual,
        timeRange,
        ['manual', 'ai']
    );

    return (
        <div className="space-y-6 pb-8">
            {/* Page Header */}
            <div className="flex flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">AI Analytics</h1>
                    <p className="text-sm text-muted-foreground">
                        See TeleAgent in action.
                    </p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-muted-foreground hidden sm:inline">Select Range</span>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-24 sm:w-28 text-sm">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Time Range</SelectLabel>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* AI Overview Cards */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Conversations"
                    value={currentData.aiOverview.totalConversations}
                    change={currentData.aiOverview.totalChange}
                    icon={Bot}
                    trend="up"
                    type="number"
                />
                <StatCard
                    title="AI Resolved"
                    value={currentData.aiOverview.aiResolved}
                    change={currentData.aiOverview.resolvedChange}
                    icon={Bot}
                    trend="up"
                    type="number"
                />
                <StatCard
                    title="AI Orders"
                    value={currentData.aiOverview.aiOrders}
                    change={currentData.aiOverview.ordersChange}
                    icon={Bot}
                    trend="up"
                    type="number"
                />
                <StatCard
                    title="Resolution Rate"
                    value={currentData.aiOverview.resolutionRate}
                    change={currentData.aiOverview.rateChange}
                    icon={Bot}
                    trend="up"
                    type="percentage"
                />
            </div>

            {/* Conversation Volume */}
            <ConversationVolumeChart
                data={conversationData}
                timeRange={timeRange}
            />

            {/* Intent Distribution & Agent Usage */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <IntentDistributionChart data={currentData.intentDistribution} />
                <VerticalBarChart
                    title="Agent Usage"
                    data={currentData.agentUsage}
                    color="var(--chart-2)"
                    formatter={formatLargeNumber}
                    isTimeSeries={false}
                />
            </div>

            {/* AI vs Manual Orders */}
            <AiVsManualChart
                data={aiVsManualData}
                timeRange={timeRange}
            />

            {/* AI Resolution & Agent Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AiResolutionChart
                    rate={currentData.aiOverview.resolutionRate}
                    resolved={currentData.aiOverview.aiResolved}
                    escalated={currentData.aiOverview.totalConversations - currentData.aiOverview.aiResolved}
                />
                <AgentPerformanceTable data={currentData.agentPerformance} />
            </div>
        </div>
    );
};

export default AiAnalyticsPage;