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
    ShieldAlert,
    Check,
    X,
    Eye,
    ExternalLink,
    MessageSquare,
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

// Helper to format friendly escalation type
const formatEscalationType = (type) => {
    if (!type) return 'General Request';
    const map = {
        ORDER_CANCELLATION: 'Order Cancellation',
        COMPLAINT: 'Customer Complaint',
        RESERVATION_REQUEST: 'Reservation Request',
        ORDER_PROBLEM: 'Order Issue',
        PAYMENT_PROBLEM: 'Payment Problem',
        REFUND_REQUEST: 'Refund Request',
        OTHER: 'Human Assistance',
    };
    return map[type] || type.replace(/_/g, ' ');
};

// ============================================================
// CONVERSATION HEADER COMPONENT
// ============================================================
const ConversationHeader = ({ conversation, onOpenViewModal }) => {
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
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 animate-pulse shrink-0">
                                    <AlertCircle className="h-2.5 w-2.5 mr-1" />
                                    Escalated
                                </Badge>
                            )}
                            {isResolved && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 shrink-0">
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

                {isEscalated && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenViewModal}
                        className="cursor-pointer h-8 text-xs font-medium border-amber-400/80 text-amber-900 dark:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 shrink-0"
                    >
                        <Eye className="h-3.5 w-3.5 mr-1.5 text-amber-600 dark:text-amber-400" />
                        View Escalation
                    </Button>
                )}
            </div>

            {/* Resolution Information Banner */}
            {isResolved && conversation.resolvedByName && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60 px-4 py-1.5 text-xs text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                            ✓ Solved by <strong>{conversation.resolvedByName}</strong>
                            {conversation.resolvedAt ? ` on ${formatTime(conversation.resolvedAt)}` : ''}
                        </span>
                    </div>
                    {conversation.escalationData?.resolvedAction && (
                        <Badge variant="outline" className="text-[10px] bg-background shrink-0">
                            Action: {conversation.escalationData.resolvedAction.replace(/_/g, ' ')}
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================
// SIMPLIFIED COMPACT ESCALATION PANEL
// ============================================================
const CompactEscalationPanel = ({ conversation, onOpenViewModal }) => {
    if (conversation.status !== 'ESCALATED') return null;

    return (
        <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-medium text-amber-950 dark:text-amber-200 min-w-0">
                <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse shrink-0" />
                <span className="truncate">Escalated</span>
            </div>

            <Button
                size="sm"
                variant="default"
                onClick={onOpenViewModal}
                className="h-7 px-3 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs shrink-0"
            >
                <Eye className="h-3.5 w-3.5 mr-1" />
                View
            </Button>
        </div>
    );
};

// ============================================================
// SINGLE WORKSPACE ESCALATION DETAILS MODAL
// Overview + Request + AI Context + Customer Message + Accept/Reject Actions
// ============================================================
const EscalationDetailsModal = ({
    isOpen,
    onClose,
    conversation,
    onAcceptRequest,
    onRejectRequest,
    isActionPending,
    pendingActionType,
}) => {
    const [messageDraft, setMessageDraft] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Clear message draft and error whenever modal closes
    useEffect(() => {
        if (!isOpen) {
            setMessageDraft('');
            setErrorMessage('');
        }
    }, [isOpen]);

    if (!conversation) return null;

    const { escalationType, escalationReason, escalationData, customer, agent, intent, status } = conversation;
    const isResolved = status === 'RESOLVED';

    // Latest customer message
    const lastCustomerMsg = conversation.messages
        ?.filter((m) => m.senderType === 'customer' || m.sender === 'CUSTOMER')
        ?.slice(-1)[0]?.content || conversation.lastMessage || '';

    const handleAcceptClick = () => {
        const trimmed = messageDraft.trim();
        if (!trimmed) {
            setErrorMessage('Please enter a message for the customer before accepting/rejecting this request.');
            return;
        }
        setErrorMessage('');
        onAcceptRequest?.(trimmed);
    };

    const handleRejectClick = () => {
        const trimmed = messageDraft.trim();
        if (!trimmed) {
            setErrorMessage('Please enter a message for the customer before accepting/rejecting this request.');
            return;
        }
        setErrorMessage('');
        onRejectRequest?.(trimmed);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isActionPending && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                                Escalation Details
                            </DialogTitle>
                        </div>
                        <Badge
                            variant={isResolved ? 'outline' : 'destructive'}
                            className={`shrink-0 text-xs ${isResolved ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' : ''}`}
                        >
                            {status}
                        </Badge>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground pt-1">
                        Review customer request, AI context, enter a customer message, and resolve the escalation.
                    </DialogDescription>
                </DialogHeader>

                {/* Scrollable Information Body */}
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">

                        {/* 1. Escalation Overview */}
                        <div className="rounded-lg border bg-card p-3 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                Escalation Overview
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Status:</span>{' '}
                                    <strong className="text-foreground capitalize">{status.toLowerCase()}</strong>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Type:</span>{' '}
                                    <strong className="text-foreground break-words">{formatEscalationType(escalationType)}</strong>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Last Activity:</span>{' '}
                                    <span className="text-foreground">{formatTime(conversation.lastMessageAt)}</span>
                                </div>
                            </div>
                            {escalationReason && (
                                <div className="pt-1.5 border-t text-xs">
                                    <span className="text-muted-foreground">Reason:</span>
                                    <p className="font-medium text-foreground mt-0.5 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/40 break-words whitespace-pre-wrap">
                                        {escalationReason}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* 2. Customer Request */}
                        <div className="rounded-lg border bg-card p-3 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 shrink-0">
                                    <User className="h-3.5 w-3.5 text-primary" />
                                    Customer Request
                                </span>
                                <span className="text-[11px] font-normal text-muted-foreground truncate min-w-0">
                                    {customer?.name} ({customer?.displayUsername || `ID: ${customer?.telegramId}`})
                                </span>
                            </div>
                            <div className="bg-muted/40 p-2.5 rounded border text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                                {lastCustomerMsg ? (
                                    <TelegramMessageContent content={lastCustomerMsg} />
                                ) : (
                                    <span className="text-muted-foreground italic">No message recorded.</span>
                                )}
                            </div>
                        </div>

                        {/* 3. AI Context & Routing */}
                        <div className="rounded-lg border bg-card p-3 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Bot className="h-3.5 w-3.5 text-primary" />
                                AI Context & Routing
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Handling Agent:</span>{' '}
                                    <span className="font-medium break-words">{agent ? agent.replace(/_/g, ' ') : 'General Agent'}</span>
                                </div>
                                <div className="min-w-0">
                                    <span className="text-muted-foreground">Detected Intent:</span>{' '}
                                    <span className="font-medium break-words">{intent ? intent.replace(/_/g, ' ') : 'General Query'}</span>
                                </div>
                            </div>

                            {/* Related Order / Reservation Details */}
                            {escalationData?.orderNumber && (
                                <div className="pt-2 border-t space-y-1.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                            <Package className="h-3.5 w-3.5 text-primary" /> Related Order Details:
                                        </span>
                                        {escalationData?.orderId && (
                                            <Link
                                                href={`/orders/${escalationData.orderId}`}
                                                className="text-[11px] text-primary hover:underline flex items-center gap-1 shrink-0"
                                                target="_blank"
                                            >
                                                View Order <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                                        <Badge variant="outline" className="font-mono text-xs break-all">
                                            #{escalationData.orderNumber}
                                        </Badge>
                                        {escalationData?.orderStatus && (
                                            <Badge variant="secondary" className="capitalize text-xs">
                                                Status: {escalationData.orderStatus.toLowerCase().replace(/_/g, ' ')}
                                            </Badge>
                                        )}
                                        {escalationData?.orderTotal && (
                                            <span className="text-muted-foreground text-xs">
                                                Total: <strong>Rs. {Number(escalationData.orderTotal).toLocaleString()}</strong>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Customer Message Area (Direct message sent upon Accept/Reject) */}
                        {!isResolved && (
                            <div className="rounded-lg border bg-card p-3 space-y-2">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
                                    <span className="flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                                        Customer Message
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-normal">
                                        (Delivered on Accept / Reject)
                                    </span>
                                </div>
                                <Textarea
                                    value={messageDraft}
                                    onChange={(e) => {
                                        setMessageDraft(e.target.value);
                                        if (errorMessage) setErrorMessage('');
                                    }}
                                    placeholder="Write a message for the customer before accepting or rejecting this request..."
                                    rows={3}
                                    className={`text-xs resize-none ${errorMessage ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                                    disabled={isActionPending}
                                />
                                {errorMessage ? (
                                    <p className="text-xs font-medium text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                        {errorMessage}
                                    </p>
                                ) : (
                                    <p className="text-[10px] text-muted-foreground">
                                        This message will automatically be sent to the customer on Telegram when you click Accept Request or Reject Request.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 5. Resolution Information (if resolved) */}
                        {isResolved && (
                            <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 space-y-1.5 text-xs text-emerald-900 dark:text-emerald-200">
                                <div className="font-semibold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Resolution Information
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">Status:</span>{' '}
                                        <strong>Resolved</strong>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">Decision:</span>{' '}
                                        <strong>{escalationData?.decision || (escalationData?.resolvedAction === 'ACCEPT_REQUEST' ? 'Accepted' : escalationData?.resolvedAction === 'REJECT_REQUEST' ? 'Rejected' : 'Resolved')}</strong>
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-muted-foreground">Handled by:</span>{' '}
                                        <strong className="break-words">{conversation.resolvedByName || 'Staff'}</strong>
                                    </div>
                                </div>
                                <div className="text-[11px] text-muted-foreground pt-0.5">
                                    Resolved on: {formatTime(conversation.resolvedAt)}
                                </div>
                            </div>
                        )}

                    </div>
                </ScrollArea>

                {/* Modal Footer with Request Actions */}
                <DialogFooter className="p-4 mx-1 mb-0.5 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={isActionPending}
                        className="w-full sm:w-auto h-8 text-xs cursor-pointer"
                    >
                        Close
                    </Button>

                    {!isResolved && (
                        <div className="flex items-center flex-wrap justify-center gap-2 w-full sm:w-auto sm:justify-end">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleRejectClick}
                                disabled={isActionPending}
                                className="h-8 text-xs font-medium border-amber-400 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950 cursor-pointer"
                            >
                                {pendingActionType === 'REJECT_REQUEST' ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <X className="h-3.5 w-3.5 mr-1" />
                                        Reject Request
                                    </>
                                )}
                            </Button>

                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleAcceptClick}
                                disabled={isActionPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium cursor-pointer"
                            >
                                {pendingActionType === 'ACCEPT_REQUEST' ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-3.5 w-3.5 mr-1" />
                                        Accept Request
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
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

    // Escalation View modal state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [pendingActionType, setPendingActionType] = useState(null); // 'SEND_MESSAGE' | 'ACCEPT_REQUEST' | 'REJECT_REQUEST' | null

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

    // Handle sending a human staff message from main chat bar
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



    // Accept Request — inline inside EscalationDetailsModal
    const handleAcceptRequest = async (messageText) => {
        try {
            setPendingActionType('ACCEPT_REQUEST');
            await escalationActionMutation.mutateAsync({
                id: conversationId,
                action: 'ACCEPT_REQUEST',
                customMessage: messageText,
                senderName: staffName,
            });
            refetch();
        } catch (err) {
            console.error('Failed to accept request:', err);
        } finally {
            setPendingActionType(null);
        }
    };

    // Reject Request — inline inside EscalationDetailsModal
    const handleRejectRequest = async (messageText) => {
        try {
            setPendingActionType('REJECT_REQUEST');
            await escalationActionMutation.mutateAsync({
                id: conversationId,
                action: 'REJECT_REQUEST',
                customMessage: messageText,
                senderName: staffName,
            });
            refetch();
        } catch (err) {
            console.error('Failed to reject request:', err);
        } finally {
            setPendingActionType(null);
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
        <div className="h-screen w-full flex flex-col bg-background">
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
                        onOpenViewModal={() => setIsViewModalOpen(true)}
                    />
                </div>

                {/* Simplified Compact Escalation Panel */}
                <CompactEscalationPanel
                    conversation={conversation}
                    onOpenViewModal={() => setIsViewModalOpen(true)}
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

            {/* Single Workspace Escalation Details Modal */}
            <EscalationDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                conversation={conversation}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                isActionPending={Boolean(pendingActionType)}
                pendingActionType={pendingActionType}
            />
        </div>
    );
};

export default ConversationDetailPage;
