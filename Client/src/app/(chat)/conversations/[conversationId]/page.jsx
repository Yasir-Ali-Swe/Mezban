'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
    ArrowLeft,
    Send,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    UserCheck,
    Bot,
    User,
    Package,
    AlertTriangle,
    ShieldAlert,
    Clock,
    FileText,
    Check,
    X,
    StickyNote,
    Plus,
} from 'lucide-react';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useSocket } from '@/contexts/SocketContext';
import {
    useConversation,
    useSendConversationMessage,
    useUpdateConversationStatus,
    useHandleEscalationAction,
} from '@/hooks/useApi';
import { TelegramMessageContent } from '@/components/shared/TelegramMessageContent';

// Helper to get avatar initials
const getInitials = (name) => {
    if (!name) return 'U';
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Helper to format time
const formatTime = (dateString) => {
    if (!dateString) return '';
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
const ConversationHeader = ({ conversation, onOpenActionModal }) => {
    const router = useRouter();
    const isEscalated = conversation.status === 'ESCALATED';
    const isResolved = conversation.status === 'RESOLVED';

    return (
        <div className="flex flex-col border-b bg-card">
            <div className="flex h-16 items-center justify-between gap-3 px-4">
                <div className="flex items-center gap-3 min-w-0">
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
                        <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-sm sm:text-base">
                                {conversation.customer.name}
                            </span>
                            {isEscalated && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 animate-pulse">
                                    <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                    Escalated
                                </Badge>
                            )}
                            {isResolved && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300">
                                    <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                    Resolved
                                </Badge>
                            )}
                        </div>

                        <div className="text-xs text-muted-foreground truncate">
                            {conversation.customer.displayUsername || `Chat ID: ${conversation.customer.telegramId}`} • Last active {formatTime(conversation.lastMessageAt)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isEscalated && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => onOpenActionModal('RESOLVE')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer h-8 text-xs sm:text-sm font-medium"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Mark as Resolved
                        </Button>
                    )}
                </div>
            </div>

            {/* Resolution Information Banner */}
            {isResolved && conversation.resolvedByName && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60 px-4 py-1.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>
                            ✓ Solved by <strong>{conversation.resolvedByName}</strong>
                            {conversation.resolvedAt ? ` on ${formatTime(conversation.resolvedAt)}` : ''}
                        </span>
                    </div>
                    {conversation.escalationData?.resolvedAction && (
                        <Badge variant="outline" className="text-[10px] bg-background">
                            Action: {conversation.escalationData.resolvedAction.replace(/_/g, ' ')}
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================
// CONTEXTUAL ESCALATION ACTION BANNER
// ============================================================
const EscalationActionBanner = ({ conversation, onOpenActionModal }) => {
    if (conversation.status !== 'ESCALATED') return null;

    const { escalationType, escalationReason, escalationData } = conversation;
    const isCancellation = escalationType === 'ORDER_CANCELLATION';
    const isComplaint = escalationType === 'COMPLAINT';
    const isReservation = escalationType === 'RESERVATION_REQUEST';
    const internalNotes = Array.isArray(escalationData?.internalNotes) ? escalationData.internalNotes : [];

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3.5 sm:p-4 text-xs sm:text-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex items-start gap-2.5">
                    {isCancellation ? (
                        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    ) : isComplaint ? (
                        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-amber-950 dark:text-amber-200">
                                {isCancellation
                                    ? '⚠ Escalated Order Cancellation Request'
                                    : isComplaint
                                        ? '⚠ Escalated Customer Complaint'
                                        : isReservation
                                            ? '⚠ Escalated Reservation Request'
                                            : '⚠ Escalated Request (Requires Staff Action)'}
                            </span>
                            {escalationData?.orderNumber && (
                                <Badge variant="outline" className="font-mono text-[11px] bg-background">
                                    #{escalationData.orderNumber}
                                </Badge>
                            )}
                            {escalationData?.orderStatus && (
                                <Badge variant="secondary" className="capitalize text-[10px]">
                                    Status: {escalationData.orderStatus.toLowerCase().replace(/_/g, ' ')}
                                </Badge>
                            )}
                        </div>

                        <p className="text-amber-900/80 dark:text-amber-200/80 text-xs leading-relaxed">
                            {escalationReason || escalationData?.complaintDetails || 'Customer requires human staff assistance.'}
                        </p>
                    </div>
                </div>

                {/* Escalation Control Buttons */}
                <div className="flex items-center flex-wrap gap-2 shrink-0 pt-1 sm:pt-0">
                    {isCancellation ? (
                        <>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => onOpenActionModal('CANCEL_ORDER')}
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground h-8 text-xs font-medium cursor-pointer"
                            >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Cancel Order
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenActionModal('REJECT_REQUEST')}
                                className="h-8 text-xs font-medium border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950 cursor-pointer"
                            >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Reject Request
                            </Button>
                        </>
                    ) : null}

                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenActionModal('ADD_NOTE')}
                        className="h-8 text-xs font-medium border-border cursor-pointer bg-background hover:bg-muted"
                    >
                        <StickyNote className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        Add Note
                    </Button>

                    <Button
                        size="sm"
                        variant="default"
                        onClick={() => onOpenActionModal('RESOLVE')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium cursor-pointer"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Mark as Resolved
                    </Button>
                </div>
            </div>

            {/* Internal Staff Notes if any */}
            {internalNotes.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-amber-500/20 space-y-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                        <StickyNote className="h-3 w-3" /> Internal Staff Notes ({internalNotes.length}):
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                        {internalNotes.map((n, idx) => (
                            <div key={n.id || idx} className="bg-background/80 rounded px-2.5 py-1 text-xs text-foreground flex items-center justify-between gap-2 border">
                                <span>{n.note}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                    {n.addedBy} • {formatTime(n.addedAt)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================
// MESSAGE GROUP RENDERER
// ============================================================
const MessageGroupRenderer = ({
    messages,
    customerName,
    customerAvatar,
    botAvatar,
}) => {
    if (!messages.length) return null;

    const firstMessage = messages[0];
    const isCustomer = firstMessage.senderType === 'customer';
    const isHumanStaff = !isCustomer && firstMessage.isHuman;
    const align = isCustomer ? 'start' : 'end';
    const variant = isCustomer ? 'muted' : isHumanStaff ? 'default' : 'default';

    const lastMessage = messages[messages.length - 1];
    const footerText = isCustomer
        ? null
        : lastMessage.isHuman
            ? (lastMessage.senderName ? `Staff: ${lastMessage.senderName}` : 'Human Staff')
            : (lastMessage.agentName || 'TeleAgent AI');

    return (
        <MessageGroup>
            {messages.map((message, index) => {
                const isLast = index === messages.length - 1;
                const showAvatar = isLast;

                return (
                    <Message key={message.id || index} align={align}>
                        {showAvatar ? (
                            <MessageAvatar>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={isCustomer ? customerAvatar : botAvatar}
                                        alt={isCustomer ? customerName : 'TeleAgent'}
                                    />
                                    <AvatarFallback>
                                        {isCustomer ? (
                                            getInitials(customerName)
                                        ) : message.isHuman ? (
                                            <User className="h-4 w-4" />
                                        ) : (
                                            <Bot className="h-4 w-4" />
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                            </MessageAvatar>
                        ) : (
                            <MessageAvatar />
                        )}

                        <MessageContent>
                            <Bubble variant={variant} align={align}>
                                <BubbleContent>
                                    <TelegramMessageContent content={message.content} />
                                </BubbleContent>
                            </Bubble>
                            {isLast && footerText && (
                                <MessageFooter className="text-[11px] text-muted-foreground mt-0.5">
                                    {footerText} • {formatTime(message.createdAt)}
                                </MessageFooter>
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
            prevMessage.isHuman !== message.isHuman ||
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
    const { user } = useUser();
    const conversationId = params.conversationId || params.id;
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const [inputText, setInputText] = useState('');
    const [newMessages, setNewMessages] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Modal state for handling escalation actions
    const [activeAction, setActiveAction] = useState(null); // 'CANCEL_ORDER' | 'REJECT_REQUEST' | 'ADD_NOTE' | 'RESOLVE' | null
    const [customActionNote, setCustomActionNote] = useState('');
    const [internalNoteText, setInternalNoteText] = useState('');

    const { socket, isConnected, joinConversation, leaveConversation } = useSocket();
    const { data: responseData, isLoading: loading, refetch } = useConversation(conversationId);
    const conversation = responseData?.data;

    const sendMessageMutation = useSendConversationMessage();
    const escalationActionMutation = useHandleEscalationAction();

    const staffName = user?.fullName || user?.firstName || 'Staff';

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
            if (messageData.conversationId === conversationId) {
                setNewMessages((prev) => {
                    const exists = prev.some((msg) => msg.id === messageData.id);
                    if (exists) return prev;
                    return [...prev, messageData];
                });
                scrollToBottom();
            }
        };

        const handleStatusUpdated = () => {
            refetch();
        };

        socket.on('new-message', handleNewMessage);
        socket.on('conversation-status-updated', handleStatusUpdated);

        return () => {
            socket.off('new-message', handleNewMessage);
            socket.off('conversation-status-updated', handleStatusUpdated);
        };
    }, [socket, conversationId, refetch, scrollToBottom]);

    // Clear new messages when conversation data changes
    useEffect(() => {
        setNewMessages([]);
    }, [conversationId]);

    // Handle sending a human staff message
    const handleSendMessage = async (e) => {
        e?.preventDefault();
        const content = inputText.trim();
        if (!content || sendMessageMutation.isPending) return;

        try {
            setInputText('');
            await sendMessageMutation.mutateAsync({
                id: conversationId,
                content,
                senderName: staffName,
            });
            scrollToBottom();
            inputRef.current?.focus();
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    // Open Action Modal
    const handleOpenActionModal = (actionType) => {
        setActiveAction(actionType);
        setCustomActionNote('');
        setInternalNoteText('');
    };

    // Execute Escalation Action
    const handleExecuteAction = async () => {
        if (!activeAction) return;

        try {
            if (activeAction === 'ADD_NOTE') {
                await escalationActionMutation.mutateAsync({
                    id: conversationId,
                    action: 'ADD_NOTE',
                    note: internalNoteText.trim(),
                    senderName: staffName,
                });
            } else {
                await escalationActionMutation.mutateAsync({
                    id: conversationId,
                    action: activeAction,
                    customMessage: customActionNote.trim() || undefined,
                    senderName: staffName,
                });
            }

            setActiveAction(null);
            setCustomActionNote('');
            setInternalNoteText('');
            refetch();
        } catch (err) {
            console.error('Failed to execute escalation action:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading conversation...</span>
                </div>
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
        <div className="h-screen w-full overflow-hidden flex flex-col bg-background">
            <div className="mx-auto flex h-full w-full max-w-4xl flex-col border-x shadow-sm">

                {/* Connection Status */}
                {!isConnected && !isInitialLoad && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/30 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 text-xs text-yellow-800 dark:text-yellow-200 flex items-center gap-2 shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse"></div>
                        Reconnecting to real-time updates...
                    </div>
                )}

                {/* Fixed Conversation Header */}
                <div className="shrink-0">
                    <ConversationHeader
                        conversation={conversation}
                        onOpenActionModal={handleOpenActionModal}
                    />
                </div>

                {/* Dedicated Escalation Action Banner */}
                <EscalationActionBanner
                    conversation={conversation}
                    onOpenActionModal={handleOpenActionModal}
                />

                {/* Messages - Scrollable Area */}
                <ScrollArea className="min-h-0 flex-1 bg-muted/10">
                    <ConversationMessages
                        conversation={conversation}
                        newMessages={newMessages}
                    />
                    <div ref={messagesEndRef} />
                </ScrollArea>

                {/* Human Message Input Area */}
                <div className="shrink-0 border-t bg-card p-3 sm:p-4">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <Input
                            ref={inputRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message to reply directly to the customer on Telegram..."
                            className="flex-1 text-sm h-10"
                            disabled={sendMessageMutation.isPending}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            size="default"
                            disabled={!inputText.trim() || sendMessageMutation.isPending}
                            className="h-10 px-4 cursor-pointer gap-1.5"
                        >
                            {sendMessageMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    <span className="hidden sm:inline">Send</span>
                                </>
                            )}
                        </Button>
                    </form>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground px-1">
                        <span>Messages are delivered directly to customer Telegram in real time.</span>
                        <span>Logged in as <strong>{staffName}</strong></span>
                    </div>
                </div>

            </div>

            {/* Contextual Escalation Action Dialog */}
            <Dialog open={Boolean(activeAction)} onOpenChange={(open) => !open && setActiveAction(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        {(activeAction === 'CANCEL_ORDER' || activeAction === 'APPROVE_CANCELLATION') && (
                            <>
                                <DialogTitle className="flex items-center gap-2 text-destructive">
                                    <ShieldAlert className="h-5 w-5" />
                                    Cancel Order
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Are you sure you want to cancel order{' '}
                                    <strong>#{conversation.escalationData?.orderNumber || 'associated order'}</strong>?
                                    <br />
                                    This will atomically set the order status to <strong>CANCELLED</strong> in the database, resolve this conversation, and send a cancellation confirmation to the customer on Telegram.
                                </DialogDescription>
                            </>
                        )}

                        {(activeAction === 'REJECT_REQUEST' || activeAction === 'REJECT_CANCELLATION') && (
                            <>
                                <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <XCircle className="h-5 w-5" />
                                    Reject Cancellation Request
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Decline cancellation for order{' '}
                                    <strong>#{conversation.escalationData?.orderNumber || 'associated order'}</strong>.
                                    <br />
                                    The order will continue in its current status, the conversation will be marked as resolved, and the customer will be notified.
                                </DialogDescription>
                            </>
                        )}

                        {activeAction === 'ADD_NOTE' && (
                            <>
                                <DialogTitle className="flex items-center gap-2 text-foreground">
                                    <StickyNote className="h-5 w-5 text-amber-500" />
                                    Add Internal Staff Note
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Add a private note for staff reference. This note will <strong>not</strong> be sent to the customer on Telegram.
                                </DialogDescription>
                            </>
                        )}

                        {activeAction === 'RESOLVE' && (
                            <>
                                <DialogTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    Mark as Resolved
                                </DialogTitle>
                                <DialogDescription className="pt-2">
                                    Are you sure you want to resolve this conversation with <strong>{conversation.customer.name}</strong>?
                                    <br />
                                    This will mark the conversation as <strong>RESOLVED</strong> and credit <strong>{staffName}</strong> as the resolver.
                                </DialogDescription>
                            </>
                        )}
                    </DialogHeader>

                    {activeAction === 'ADD_NOTE' ? (
                        <div className="space-y-2 py-2">
                            <label className="text-xs font-medium text-foreground">
                                Internal Staff Note:
                            </label>
                            <Textarea
                                value={internalNoteText}
                                onChange={(e) => setInternalNoteText(e.target.value)}
                                placeholder="e.g. Customer called by phone, agreed to delivery delay of 10 mins..."
                                rows={3}
                                className="text-xs"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2 py-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                Optional custom message to customer on Telegram:
                            </label>
                            <Textarea
                                value={customActionNote}
                                onChange={(e) => setCustomActionNote(e.target.value)}
                                placeholder="Leave blank to send standard automated customer response..."
                                rows={3}
                                className="text-xs"
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setActiveAction(null)}
                            disabled={escalationActionMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="default"
                            onClick={handleExecuteAction}
                            disabled={
                                escalationActionMutation.isPending ||
                                (activeAction === 'ADD_NOTE' && !internalNoteText.trim())
                            }
                            className={
                                activeAction === 'CANCEL_ORDER' || activeAction === 'APPROVE_CANCELLATION'
                                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                                    : activeAction === 'REJECT_REQUEST' || activeAction === 'REJECT_CANCELLATION'
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }
                        >
                            {escalationActionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            )}
                            {activeAction === 'CANCEL_ORDER' ? 'Confirm Cancellation' : activeAction === 'ADD_NOTE' ? 'Save Note' : 'Confirm & Execute'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ConversationDetailPage;
