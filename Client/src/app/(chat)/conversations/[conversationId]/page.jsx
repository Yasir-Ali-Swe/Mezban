'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Bubble,
    BubbleContent,
    BubbleGroup,
} from '@/components/ui/bubble';
import {
    Message,
    MessageAvatar,
    MessageContent,
    MessageFooter,
    MessageGroup,
} from '@/components/ui/message';
import { ChevronDown } from 'lucide-react';
import {
    Collapsible,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_CONVERSATION = {
    id: 'conv_000001',
    customer: {
        id: 'cus_001',
        name: 'Ahmed Khan',
        username: 'ahmed123',
        avatar: 'https://github.com/shadcn.png',
    },
    botAvatar: 'https://github.com/shadcn.png',
    botName: 'TeleAgent Bot',
    lastMessageAt: '2026-08-09T14:42:00Z',
    messages: [
        // Customer messages
        {
            id: 'msg_001',
            conversationId: 'conv_000001',
            senderType: 'customer',
            content: 'Hi, do you have Zinger Burger?',
            createdAt: '2026-08-09T14:30:00Z',
        },
        // Product Agent responses
        {
            id: 'msg_002',
            conversationId: 'conv_000001',
            senderType: 'agent',
            content: 'Yes, Zinger Burger is available.',
            createdAt: '2026-08-09T14:30:45Z',
            agentType: 'product',
            agentName: 'Product Agent',
        },
        {
            id: 'msg_003',
            conversationId: 'conv_000001',
            senderType: 'agent',
            content: 'It is priced at Rs. 650.',
            createdAt: '2026-08-09T14:31:10Z',
            agentType: 'product',
            agentName: 'Product Agent',
        },
        // Customer follow-up
        {
            id: 'msg_004',
            conversationId: 'conv_000001',
            senderType: 'customer',
            content: 'I want two burgers, please.',
            createdAt: '2026-08-09T14:32:00Z',
        },
        // Order Agent responses
        {
            id: 'msg_005',
            conversationId: 'conv_000001',
            senderType: 'agent',
            content: 'Sure. I can help you create the order for 2 Zinger Burgers.',
            createdAt: '2026-08-09T14:32:30Z',
            agentType: 'order',
            agentName: 'Order Agent',
        },
        {
            id: 'msg_006',
            conversationId: 'conv_000001',
            senderType: 'agent',
            content: 'Your order has been prepared for confirmation. Would you like to proceed?',
            createdAt: '2026-08-09T14:33:15Z',
            agentType: 'order',
            agentName: 'Order Agent',
        },
        // Customer confirms
        {
            id: 'msg_007',
            conversationId: 'conv_000001',
            senderType: 'customer',
            content: 'Yes, please confirm the order.',
            createdAt: '2026-08-09T14:34:00Z',
        },
        // Order Agent final
        {
            id: 'msg_008',
            conversationId: 'conv_000001',
            senderType: 'agent',
            content: 'Order confirmed! Your order #ORD-1234 has been placed. You will receive a confirmation shortly.',
            createdAt: '2026-08-09T14:34:45Z',
            agentType: 'order',
            agentName: 'Order Agent',
        },
    ],
};

// Helper to get avatar initials
const getInitials = (name) => {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper to format time
const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    if (date >= today) {
        return `Today, ${timeStr}`;
    } else if (date >= yesterday) {
        return `Yesterday, ${timeStr}`;
    } else {
        return (
            date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }) + `, ${timeStr}`
        );
    }
};

// ============================================================
// CONVERSATION HEADER COMPONENT
// ============================================================
const ConversationHeader = ({ conversation }) => {
    const router = useRouter();
    return (
        <div className="flex h-16 items-center gap-3 px-4 bg-card border-x">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="shrink-0 cursor-pointer"
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage
                    src={conversation.customer.avatar}
                    alt={conversation.customer.name}
                />
                <AvatarFallback>
                    {getInitials(conversation.customer.name)}
                </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
                <div className="truncate font-medium">
                    {conversation.customer.name}
                </div>

                <div className="text-xs text-muted-foreground">
                    {formatTime(conversation.lastMessageAt)}
                </div>
            </div>
        </div>
    );
};

// ============================================================
// MESSAGE GROUP RENDERER
// ============================================================
const MESSAGE_PREVIEW_LENGTH = 180;

const MessageBubbleContent = ({ content }) => {
    const [open, setOpen] = useState(false);

    const isLong = content.length > MESSAGE_PREVIEW_LENGTH;

    const preview = `${content.slice(0, MESSAGE_PREVIEW_LENGTH)}...`;

    return (
        <BubbleContent className="whitespace-pre-line">
            <Collapsible open={open} onOpenChange={setOpen}>
                <div>
                    {open || !isLong ? content : preview}
                </div>

                {isLong && (
                    <CollapsibleTrigger
                        render={
                            <Button
                                variant="link"
                                className="mt-1 h-auto gap-1 p-0 text-xs text-muted-foreground"
                            >
                                {open ? 'Show less' : 'Show more'}

                                <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''
                                        }`}
                                />
                            </Button>
                        }
                    />
                )}
            </Collapsible>
        </BubbleContent>
    );
};
const MessageGroupRenderer = ({ messages,
    customerName,
    customerAvatar,
    botAvatar, }) => {
    if (!messages.length) return null;

    const firstMessage = messages[0];
    const isCustomer = firstMessage.senderType === 'customer';
    const align = isCustomer ? 'start' : 'end';
    const variant = isCustomer ? 'muted' : 'default';

    // Determine if we should show agent name footer
    const showAgentFooter = !isCustomer && messages.some((m) => m.agentName);
    const agentName = messages.find((m) => m.agentName)?.agentName;

    return (
        <MessageGroup>
            {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const showAvatar = isLast; // Only show avatar on last message

                return (
                    <Message key={message.id} align={align}>
                        {/* Avatar - only on last message */}
                        {showAvatar ? (
                            <MessageAvatar>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={isCustomer ? customerAvatar : botAvatar}
                                        alt={isCustomer ? customerName : "TeleAgent"}
                                    />

                                    <AvatarFallback>
                                        {isCustomer
                                            ? getInitials(customerName)
                                            : "AI"}
                                    </AvatarFallback>
                                </Avatar>
                            </MessageAvatar>
                        ) : (
                            <MessageAvatar />
                        )}

                        <MessageContent>
                            {/* <Bubble variant={variant} align={align}>
                                <BubbleContent>{message.content}</BubbleContent>
                            </Bubble> */}
                            <Bubble variant={variant} align={align}>
                                <MessageBubbleContent content={message.content} />
                            </Bubble>
                            {/* Footer - only on last message if agent */}
                            {showAgentFooter && isLast && agentName && (
                                <MessageFooter>{agentName}</MessageFooter>
                            )}
                        </MessageContent>
                    </Message>
                );
            })}
        </MessageGroup>
    );
};

// ============================================================
// CONVERSATION MESSAGES COMPONENT
// ============================================================
const ConversationMessages = ({ conversation }) => {
    const { messages, customer, botAvatar } = conversation;

    // Group consecutive messages from the same sender.
    // Agent messages are also split when the agent changes.
    const groupedMessages = [];
    let currentGroup = [];

    messages.forEach((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;

        const isNewGroup =
            !prevMessage ||
            prevMessage.senderType !== message.senderType ||
            (
                message.senderType === 'agent' &&
                prevMessage.agentName !== message.agentName
            );

        if (isNewGroup) {
            if (currentGroup.length > 0) {
                groupedMessages.push(currentGroup);
            }

            currentGroup = [message];
        } else {
            currentGroup.push(message);
        }
    });

    if (currentGroup.length > 0) {
        groupedMessages.push(currentGroup);
    }

    return (
        <div className="flex flex-col gap-3 p-4">
            {groupedMessages.map((group, index) => (
                <MessageGroupRenderer
                    key={index}
                    messages={group}
                    customerName={customer.name}
                    customerAvatar={customer.avatar}
                    botAvatar={botAvatar}
                />
            ))}
        </div>
    );
};
// ============================================================
// MAIN CONVERSATION DETAIL PAGE
// ============================================================
const ConversationDetailPage = () => {
    const params = useParams();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(true);

    // In a real app, fetch from API using params.id
    useEffect(() => {
        // Simulate API call
        const fetchConversation = async () => {
            setLoading(true);
            try {
                // Mock API call
                await new Promise((resolve) => setTimeout(resolve, 500));
                setConversation(MOCK_CONVERSATION);
            } catch (error) {
                console.error('Error fetching conversation:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversation();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-muted-foreground">Loading conversation...</div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-muted-foreground">Conversation not found</p>
                <Link href="/conversations">
                    <Button variant="outline" size="sm" className="cursor-pointer">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Conversations
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-3xl flex-col">

                {/* Fixed Conversation Header */}
                <div className="shrink-0 border-b">
                    <ConversationHeader conversation={conversation} />
                </div>

                {/* Only the messages scroll */}
                <ScrollArea className="min-h-0 flex-1 border-x">
                    <ConversationMessages conversation={conversation} />
                </ScrollArea>

            </div>
        </div>
    );
};

export default ConversationDetailPage;