'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
    FieldContent,
    FieldDescription,
} from '@/components/ui/field';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ============================================================
// ZOD SCHEMA
// ============================================================
const telegramConnectSchema = z.object({
    botToken: z.string().min(1, 'Bot token is required'),
});

// ============================================================
// MAIN PAGE
// ============================================================
const TelegramConnectPage = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [botInfo, setBotInfo] = useState(null);


    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(telegramConnectSchema),
        defaultValues: {
            botToken: '',
        },
    });

    const botToken = watch('botToken');

    useEffect(() => {
        // Check if user has completed previous steps
        const businessType = localStorage.getItem('businessType');
        const dashboardUrl = businessType === "ECOMMERCE" ? "/ecommerce" : "/restaurant";
        if (!businessType) {
            router.push('/onboarding/business-type');
        }
        setIsLoading(false);
    }, [router]);

    const handleConnect = async (data) => {
        setIsConnecting(true);
        try {
            // Simulate API call to verify token
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Mock successful response from Telegram getMe
            const mockBotInfo = {
                id: 123456789,
                name: 'StyleHub Assistant',
                username: 'StyleHubBot',
                isBot: true,
                avatar: 'https://github.com/shadcn.png',
            };

            setBotInfo(mockBotInfo);
            setIsConnected(true);

            toast.success('Telegram bot connected successfully!');
        } catch (error) {
            toast.error('Failed to connect Telegram bot. Please check your token and try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleContinue = () => {
        const businessType = localStorage.getItem('businessType');
        const dashboardUrl = businessType === "ECOMMERCE" ? "/ecommerce" : "/restaurant";
        router.push(dashboardUrl);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-left space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Connect your Telegram bot</h1>
                    <p className="text-sm text-muted-foreground">
                        Connect your Telegram bot to TeleAgent so your AI agents can communicate with your customers through Telegram.
                    </p>
                </div>

                {!isConnected ? (
                    // ============================================
                    // CONNECTION FORM
                    // ============================================
                    <form onSubmit={handleSubmit(handleConnect)}>
                        <FieldGroup className="space-y-6">
                            {/* Bot Token Field */}
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
                                            {showToken ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                    {errors.botToken && (
                                        <FieldError errors={[errors.botToken]} />
                                    )}
                                </FieldContent>
                            </Field>

                            {/* Help Text */}
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

                            {/* Navigation Buttons */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 text-sm font-medium w-full sm:w-auto"
                                    onClick={() => router.push('/onboarding/business-knowledge')}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-10 text-sm font-medium w-full sm:w-auto"
                                    disabled={!botToken || isConnecting}
                                >
                                    {isConnecting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        'Connect Telegram'
                                    )}
                                </Button>
                            </div>
                        </FieldGroup>
                    </form>
                ) : (
                    // ============================================
                    // SUCCESS STATE
                    // ============================================
                    <div className="space-y-6">
                        {/* Bot Information */}
                        {botInfo && (
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center justify-cente flex-shrink-0">
                                        {botInfo.avatar ? (
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={botInfo.avatar} />
                                                <AvatarFallback>{botInfo.name}</AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <Bot className="h-12 w-12 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{botInfo.name}</p>
                                        <p className="text-sm text-muted-foreground">@{botInfo.username}</p>
                                        <Badge variant="outline" className="mt-1 text-xs">
                                            Bot ID: {botInfo.id}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-6 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                                        Telegram connected successfully
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your Telegram bot is now connected to TeleAgent.
                                    </p>
                                </div>
                            </div>
                        </div>



                        {/* Continue Button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                            <div></div> {/* Empty div for spacing */}
                            <Button
                                type="button"
                                className="h-10 text-sm font-medium w-full sm:w-auto"
                                onClick={handleContinue}
                            >
                                Continue to Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default TelegramConnectPage;