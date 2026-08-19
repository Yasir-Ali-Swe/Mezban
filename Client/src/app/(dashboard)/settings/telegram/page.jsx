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
    FieldDescription,
    FieldError,
} from '@/components/ui/field';
import { Copy, ExternalLink, RefreshCw, CheckCircle, XCircle, Calendar, Clock, Loader2, Eye, EyeOff, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTelegramConfig, useConnectTelegramBot, useDisconnectTelegramBot } from '@/hooks/useApi';

const telegramConnectSchema = z.object({
    botToken: z.string().min(1, 'Bot token is required'),
});

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard!`);
    }).catch(() => {
        toast.error('Failed to copy to clipboard');
    });
};

const TelegramSettingsPage = () => {
    const { data: responseData, isLoading: isFetching, refetch } = useTelegramConfig();
    const connectBotMutation = useConnectTelegramBot();
    const disconnectBotMutation = useDisconnectTelegramBot();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [showToken, setShowToken] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(telegramConnectSchema),
        defaultValues: { botToken: '' },
    });

    const botToken = watch('botToken');
    const botData = responseData?.data;

    const handleConnect = async (data) => {
        setIsConnecting(true);
        try {
            await connectBotMutation.mutateAsync({ botToken: data.botToken });
            toast.success('Telegram bot connected successfully!');
            reset();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to connect Telegram bot. Please check your token.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Telegram bot?')) return;
        setIsDisconnecting(true);
        try {
            await disconnectBotMutation.mutateAsync();
            toast.success('Telegram bot disconnected successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disconnect Telegram bot');
        } finally {
            setIsDisconnecting(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            toast.success('Webhook status refreshed successfully!');
        } catch {
            toast.error('Failed to refresh bot status');
        } finally {
            setIsRefreshing(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!botData || !botData.bot || !botData.bot.isConnected) {
        return (
            <div className="flex justify-center px-4 py-6 sm:py-8">
                <div className="w-full max-w-2xl">
                    <div className="text-left space-y-2 mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">Connect Telegram Bot</h1>
                        <p className="text-sm text-muted-foreground">
                            Connect your Telegram bot using the token provided by Telegram&apos;s BotFather.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(handleConnect)}>
                        <FieldGroup className="space-y-6">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="botToken" className="text-sm font-medium">
                                    Telegram Bot Token <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldDescription className="text-sm text-muted-foreground">
                                    Enter the bot token provided by Telegram&apos;s BotFather.
                                </FieldDescription>
                                <FieldContent>
                                    <div className="relative">
                                        <Input
                                            id="botToken"
                                            type={showToken ? 'text' : 'password'}
                                            placeholder="Example: 123456789:AAExampleBotToken..."
                                            className="h-10 text-sm pr-10"
                                            {...register('botToken')}
                                            aria-invalid={errors.botToken ? 'true' : 'false'}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            onClick={() => setShowToken(!showToken)}
                                        >
                                            {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.botToken && <FieldError errors={[errors.botToken]} />}
                                </FieldContent>
                            </Field>

                            <div className="rounded-lg border border-border bg-muted/30 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Don&apos;t have a Telegram bot yet?{' '}
                                    <a
                                        href="https://t.me/botfather"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline font-medium"
                                    >
                                        Create one using Telegram&apos;s BotFather
                                    </a>
                                    {' '}and copy the token it provides.
                                </p>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-border">
                                <Button
                                    type="submit"
                                    className="h-10 text-sm font-medium"
                                    disabled={!botToken || isConnecting}
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        'Connect Telegram Bot'
                                    )}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                <form onSubmit={(e) => e.preventDefault()}>
                    <FieldGroup className="space-y-4">
                        {/* Bot Avatar + Name + Username */}
                        <div className="flex flex-col justify-center items-center gap-4 py-2 text-center">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={botData.bot.avatarUrl} alt={botData.bot.name} />
                                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                    {botData.bot.name ? botData.bot.name.charAt(0) : 'B'}
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

                        {/* Row 2: Connected On */}
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

                        {/* Row 3: Bot Link + Deep Link */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium text-muted-foreground">
                                    Bot Link
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Input
                                            value={botData.botLinks?.botLink || ''}
                                            readOnly
                                            className="h-10 text-sm text-primary font-medium bg-muted/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(botData.botLinks?.botLink, 'Bot link')}
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
                                            value={botData.botLinks?.deepLink || ''}
                                            readOnly
                                            className="h-10 text-sm text-primary font-medium bg-muted/50 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(botData.botLinks?.deepLink, 'Deep link')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/80 transition-colors"
                                        >
                                            <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                        </button>
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Open in Telegram Button */}
                        <div className="flex justify-end gap-2">
                            {botData.botLinks?.botLink && (
                                <Button
                                    size="sm"
                                    className="h-9 text-sm"
                                    onClick={() => window.open(botData.botLinks.botLink, '_blank')}
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                    Open in Telegram
                                </Button>
                            )}
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
                                            variant={botData.webhook?.status === 'connected' ? 'default' : 'secondary'}
                                            className={cn(
                                                "text-xs gap-1.5",
                                                botData.webhook?.status === 'connected'
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                            )}
                                        >
                                            {botData.webhook?.status === 'connected' ? (
                                                <CheckCircle className="h-3 w-3" />
                                            ) : (
                                                <XCircle className="h-3 w-3" />
                                            )}
                                            {botData.webhook?.status === 'connected' ? 'Connected' : 'Disconnected'}
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
                                        {formatDate(botData.webhook?.lastUpdate)}
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 6: Webhook URL */}
                        <Field orientation="vertical">
                            <FieldLabel className="text-sm font-medium text-muted-foreground">
                                Webhook URL
                            </FieldLabel>
                            <FieldContent>
                                <Input
                                    value={botData.webhook?.url || ''}
                                    readOnly
                                    className="h-10 text-sm font-mono text-primary bg-muted/50"
                                />
                            </FieldContent>
                        </Field>

                        {/* Actions: Refresh & Disconnect */}
                        <div className="flex justify-between items-center pt-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-9 text-sm"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                            >
                                {isDisconnecting ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                        Disconnecting...
                                    </>
                                ) : (
                                    'Disconnect Bot'
                                )}
                            </Button>

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