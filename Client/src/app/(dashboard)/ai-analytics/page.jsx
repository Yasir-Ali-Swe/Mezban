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
import { useAiAnalytics } from '@/hooks/useApi';
import { getTimeSeriesData } from '@/lib/chartUtils';
import {
    Loader2,
    MessageSquare,  // For Total Conversations
    CheckCircle,    // For AI Resolved
    ShoppingBag,    // For AI Orders
    TrendingUp,     // For Resolution Rate
    Sparkles,
    Target,
    BarChart3
} from 'lucide-react';

import { formatNumber } from '@/lib/formatters';

// Helper function to format large numbers
const formatLargeNumber = (value) => formatNumber(value);

const AiAnalyticsPage = () => {
    const [timeRange, setTimeRange] = useState('weekly');
    const { data: responseData, isLoading } = useAiAnalytics(timeRange);

    const currentData = responseData?.data || {
        aiOverview: { totalConversations: 0, totalChange: 0, aiResolved: 0, resolvedChange: 0, aiOrders: 0, ordersChange: 0, resolutionRate: 0, rateChange: 0 },
        conversationVolume: [],
        intentDistribution: [],
        agentUsage: [],
        aiVsManual: [],
        agentPerformance: [],
    };

    // Prepare time-series data with aggregation
    const conversationData = getTimeSeriesData(
        currentData.conversationVolume || [],
        timeRange,
        ['conversations']
    );

    const aiVsManualData = getTimeSeriesData(
        currentData.aiVsManual || [],
        timeRange,
        ['manual', 'ai']
    );

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                    value={currentData.aiOverview?.totalConversations || 0}
                    change={currentData.aiOverview?.totalChange || 0}
                    icon={MessageSquare}
                    iconClassName={"text-blue-500"}
                    trend={(currentData.aiOverview?.totalChange || 0) >= 0 ? "up" : "down"}
                    type="number"
                />

                <StatCard
                    title="AI Resolved"
                    value={currentData.aiOverview?.aiResolved || 0}
                    change={currentData.aiOverview?.resolvedChange || 0}
                    icon={CheckCircle}
                    iconClassName={"text-green-500"}
                    trend={(currentData.aiOverview?.resolvedChange || 0) >= 0 ? "up" : "down"}
                    type="number"
                />

                <StatCard
                    title="AI Orders"
                    value={currentData.aiOverview?.aiOrders || 0}
                    change={currentData.aiOverview?.ordersChange || 0}
                    icon={ShoppingBag}
                    iconClassName={"text-purple-500"}
                    trend={(currentData.aiOverview?.ordersChange || 0) >= 0 ? "up" : "down"}
                    type="number"
                />

                <StatCard
                    title="Resolution Rate"
                    value={currentData.aiOverview?.resolutionRate || 0}
                    change={currentData.aiOverview?.rateChange || 0}
                    icon={Target}
                    iconClassName={"text-orange-500"}
                    trend={(currentData.aiOverview?.rateChange || 0) >= 0 ? "up" : "down"}
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
                <IntentDistributionChart data={currentData.intentDistribution || []} />
                <VerticalBarChart
                    title="Agent Usage"
                    data={currentData.agentUsage || []}
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
                    rate={currentData.aiOverview?.resolutionRate || 0}
                    resolved={currentData.aiOverview?.aiResolved || 0}
                    escalated={Math.max(0, (currentData.aiOverview?.totalConversations || 0) - (currentData.aiOverview?.aiResolved || 0))}
                />
                <AgentPerformanceTable data={currentData.agentPerformance || []} />
            </div>
        </div>
    );
};

export default AiAnalyticsPage;