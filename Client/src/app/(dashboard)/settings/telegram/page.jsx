'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
    Field,
    FieldLabel,
    FieldGroup,
    FieldContent,
} from '@/components/ui/field';
import { Copy, ExternalLink, RefreshCw, CheckCircle, XCircle, Calendar, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy Telegram bot data
const DUMMY_BOT_DATA = {
    bot: {
        id: '712548963',
        name: 'Burger House Assistant',
        username: '@BurgerHouseBot',
        avatarUrl: 'https://ui-avatars.com/api/?name=Burger+House+Assistant&background=0088CC&color=fff&size=128',
        isConnected: true,
        connectedOn: '2026-08-07T14:15:00Z',
    },
    botLinks: {
        botLink: 'https://t.me/BurgerHouseBot',
        deepLink: 'https://t.me/BurgerHouseBot?start=business_123',
    },
    webhook: {
        status: 'connected',
        url: 'https://api.yourapp.com/api/v1/telegram/webhook/restaurant_123',
        lastUpdate: '2026-08-07T17:42:00Z',
    },
};

// Format date
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Copy to clipboard function
const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
        toast.error('Failed to copy to clipboard');
    });
};

const TelegramSettingsPage = () => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const botData = DUMMY_BOT_DATA;

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate refresh
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success('Webhook status refreshed successfully!');
        }, 1500);
    };

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                {/* Form */}
                <form onSubmit={(e) => e.preventDefault()}>
                    <FieldGroup className="space-y-4">
                        {/* Bot Avatar + Name + Username */}
                        <div className="flex flex-col justify-center items-center gap-4 py-2 text-center">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={botData.bot.avatarUrl} alt={botData.bot.name} />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {botData.bot.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-base font-semibold">{botData.bot.name}</p>
                                <p className="text-sm text-muted-foreground">{botData.bot.username}</p>
                            </div>
                        </div>

                        {/* Row 1: Bot ID + Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Bot ID
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        value={botData.bot.id}
                                        readOnly
                                        className="h-10 text-sm font-mono bg-muted/50"
                                    />
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Status
                                </FieldLabel>
                                <FieldContent>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                                        <Badge
                                            variant={botData.bot.isConnected ? 'default' : 'secondary'}
                                            className={cn(
                                                "text-xs gap-1.5",
                                                botData.bot.isConnected
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                            )}
                                        >
                                            {botData.bot.isConnected ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <XCircle className="h-3 w-3" />
                                            )}
                                            {botData.bot.isConnected ? 'Connected' : 'Disconnected'}
                                        </Badge>
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 2: Connected On (Full Width) */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium text-muted-foreground">
                                Connected On
                            </FieldLabel>
                            <FieldContent>
                                <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    {formatDate(botData.bot.connectedOn)}
                                </div>
                            </FieldContent>
                        </Field>

                        {/* Section Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-4 text-xs text-muted-foreground">Bot Links</span>
                            </div>
                        </div>

                        {/* Row 3: Bot Link + Deep Link with Copy Icons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Bot Link
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Input
                                            value={botData.botLinks.botLink}
                                            readOnly
                                            className="h-10 text-sm text-primary font-medium bg-muted/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(botData.botLinks.botLink, 'Bot link')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/80 transition-colors"
                                        >
                                            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Deep Link
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Input
                                            value={botData.botLinks.deepLink}
                                            readOnly
                                            className="h-10 text-sm text-primary font-medium bg-muted/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(botData.botLinks.deepLink, 'Deep link')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/80 transition-colors"
                                        >
                                            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Open in Telegram Button - Right Aligned */}
                        <div className="flex justify-end">
                            <Button
                                size="sm"
                                className="h-9 text-sm"
                                onClick={() => window.open(botData.botLinks.botLink, '_blank')}
                            >
                                <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                Open in Telegram
                            </Button>
                        </div>

                        {/* Section Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t"></div>
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-background px-4 text-xs text-muted-foreground">Webhook Information</span>
                            </div>
                        </div>

                        {/* Row 5: Webhook Status + Last Update */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Webhook Status
                                </FieldLabel>
                                <FieldContent>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center">
                                        <Badge
                                            variant={botData.webhook.status === 'connected' ? 'default' : 'secondary'}
                                            className={cn(
                                                "text-xs gap-1.5",
                                                botData.webhook.status === 'connected'
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                            )}
                                        >
                                            {botData.webhook.status === 'connected' ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <XCircle className="h-3 w-3" />
                                            )}
                                            {botData.webhook.status === 'connected' ? 'Connected' : 'Disconnected'}
                                        </Badge>
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Last Update
                                </FieldLabel>
                                <FieldContent>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        {formatDate(botData.webhook.lastUpdate)}
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 6: Webhook URL (Full Width) */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium text-muted-foreground">
                                Webhook URL
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    value={botData.webhook.url}
                                    readOnly
                                    className="h-10 text-sm font-mono text-primary bg-muted/50"
                                />
                            </FieldContent>
                        </Field>

                        {/* Refresh Button - Right Aligned */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-sm"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                {isRefreshing ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        Refreshing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Refresh Status
                                    </>
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default TelegramSettingsPage;