'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { useSocket } from '@/contexts/SocketContext';
import { useConversation } from '@/hooks/useApi';

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

    const showAgentFooter = !isCustomer && messages.some((m) => m.agentName);
    const agentName = messages.find((m) => m.agentName)?.agentName;

    return (
        <MessageGroup>
            {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const showAvatar = isLast;

                return (
                    <Message key={message.id} align={align}>
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
                            <Bubble variant={variant} align={align}>
                                <MessageBubbleContent content={message.content} />
                            </Bubble>
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
const ConversationMessages = ({ conversation, newMessages = [] }) => {
    const { messages = [], customer = {}, botAvatar } = conversation;

    // Deduplicate messages by id
    const seenIds = new Set();
    const allMessages = [...messages, ...newMessages].filter((m) => {
        if (!m || !m.id) return true;
        if (seenIds.has(m.id)) return false;
        seenIds.add(m.id);
        return true;
    });

    // Group consecutive messages from the same sender
    const groupedMessages = [];
    let currentGroup = [];

    allMessages.forEach((message, index) => {
        const prevMessage = index > 0 ? allMessages[index - 1] : null;

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
    const router = useRouter();
    const conversationId = params.conversationId || params.id;
    const messagesEndRef = useRef(null);
    const [newMessages, setNewMessages] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const processingRef = useRef(false);

    const { socket, isConnected, joinConversation, leaveConversation } = useSocket();
    const { data: responseData, isLoading: loading, refetch } = useConversation(conversationId);
    const conversation = responseData?.data;

    // Scroll to bottom when new messages arrive
    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    // Scroll to bottom on initial load
    useEffect(() => {
        if (!loading && conversation) {
            scrollToBottom();
            setIsInitialLoad(false);
        }
    }, [loading, conversation, scrollToBottom]);

    // Join conversation room when component mounts
    useEffect(() => {
        if (!socket || !isConnected || !conversationId) return;

        joinConversation(conversationId);

        return () => {
            leaveConversation(conversationId);
        };
    }, [socket, isConnected, conversationId, joinConversation, leaveConversation]);

    // Listen for new messages - with deduplication
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (messageData) => {
            // Only add if it's for this conversation
            if (messageData.conversationId === conversationId) {
                // Check if message already exists (prevent duplicates)
                setNewMessages((prev) => {
                    const exists = prev.some(msg => msg.id === messageData.id);
                    if (exists) return prev;
                    return [...prev, messageData];
                });
                scrollToBottom();
            }
        };

        socket.on('new-message', handleNewMessage);

        return () => {
            socket.off('new-message', handleNewMessage);
        };
    }, [socket, conversationId, scrollToBottom]);

    // Refetch conversation when we get a conversation-updated event - with debounce
    useEffect(() => {
        if (!socket) return;

        let timeoutId = null;

        const handleConversationUpdated = (data) => {
            if (data.conversationId === conversationId) {
                // Debounce refetch to prevent multiple calls
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    refetch();
                }, 300);
            }
        };

        socket.on('conversation-updated', handleConversationUpdated);

        return () => {
            socket.off('conversation-updated', handleConversationUpdated);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [socket, conversationId, refetch]);

    // Clear new messages when conversation data changes
    useEffect(() => {
        setNewMessages([]);
    }, [conversationId]);

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

                {/* Connection Status */}
                {!isConnected && !isInitialLoad && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                        Reconnecting to real-time updates...
                    </div>
                )}

                {/* Fixed Conversation Header */}
                <div className="shrink-0 border-b">
                    <ConversationHeader conversation={conversation} />
                </div>

                {/* Messages - Only the messages scroll */}
                <ScrollArea className="min-h-0 flex-1 border-x">
                    <ConversationMessages
                        conversation={conversation}
                        newMessages={newMessages}
                    />
                    <div ref={messagesEndRef} />
                </ScrollArea>

            </div>
        </div>
    );
};

export default ConversationDetailPage;
