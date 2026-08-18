import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, AlertTriangle, Clock, Check, Package } from 'lucide-react';

const STATUS_CONFIG = {
    // ─── Active/Inactive (Categories, Products, Deals) ──────────────────────
    active: {
        variant: 'default',
        className: 'text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3',
        label: 'Active',
    },
    inactive: {
        variant: 'destructive',
        className: 'text-[10px] gap-1',
        icon: XCircle,
        iconClassName: 'h-3 w-3',
        label: 'Inactive',
    },
    // ─── Available/Unavailable (Menu) ──────────────────────────────────────
    available: {
        variant: 'default',
        className: 'text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3',
        label: 'Available',
    },
    unavailable: {
        variant: 'destructive',
        className: 'text-[10px] gap-1',
        icon: XCircle,
        iconClassName: 'h-3 w-3',
        label: 'Unavailable',
    },
    // ─── Conversation Status ────────────────────────────────────────────────
    resolved: {
        variant: 'default',
        className: 'bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-400',
        label: 'Resolved',
    },
    active_status: {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400',
        label: 'Active',
    },
    escalated: {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400',
        label: 'Escalated',
    },
    abandoned: {
        variant: 'outline',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-900/30 dark:text-gray-400',
        label: 'Abandoned',
    },
    // ─── Order Status ────────────────────────────────────────────────────────
    pending: {
        variant: 'default',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: Clock,
        iconClassName: 'h-3 w-3',
        label: 'Pending',
    },
    confirmed: {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Check,
        iconClassName: 'h-3 w-3',
        label: 'Confirmed',
    },
    preparing: {
        variant: 'default',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        icon: Clock,
        iconClassName: 'h-3 w-3',
        label: 'Preparing',
    },
    ready: {
        variant: 'default',
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3',
        label: 'Ready',
    },
    processing: {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: Package,
        iconClassName: 'h-3 w-3',
        label: 'Processing',
    },
    completed: {
        variant: 'default',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3',
        label: 'Completed',
    },
    cancelled: {
        variant: 'default',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: XCircle,
        iconClassName: 'h-3 w-3',
        label: 'Cancelled',
    },
    // ─── Telegram Connection ────────────────────────────────────────────────
    connected: {
        variant: 'default',
        className: 'className="text-[10px] gap-1 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
        icon: CheckCircle,
        iconClassName: 'h-3 w-3',
        label: 'Connected',
    },
    disconnected: {
        variant: 'secondary',
        className: 'text-[10px] gap-1',
        icon: XCircle,
        iconClassName: 'h-3 w-3',
        label: 'Not Connected',
    },
    // ─── Alert Priority ──────────────────────────────────────────────────────
    high: {
        variant: 'default',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: AlertTriangle,
        iconClassName: 'h-3 w-3',
        label: 'High',
    },
    medium: {
        variant: 'default',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: AlertTriangle,
        iconClassName: 'h-3 w-3',
        label: 'Medium',
    },
    low: {
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: AlertTriangle,
        iconClassName: 'h-3 w-3',
        label: 'Low',
    },
    // ─── Intent Badge ──────────────────────────────────────────────────────
    intent: {
        variant: 'outline',
        className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        label: '',
    },
};

/**
 * Map various status values to config keys
 */
const getConfigKey = (status) => {
    // Handle boolean values
    if (typeof status === 'boolean') {
        return status ? 'active' : 'inactive';
    }

    // Handle string values
    if (typeof status === 'string') {
        const lowerStatus = status.toLowerCase();

        // Active/Inactive
        if (lowerStatus === 'active') return 'active';
        if (lowerStatus === 'inactive') return 'inactive';

        // Available/Unavailable
        if (lowerStatus === 'available') return 'available';
        if (lowerStatus === 'unavailable') return 'unavailable';

        // Conversation status (uppercase from API)
        if (lowerStatus === 'resolved') return 'resolved';
        if (lowerStatus === 'active_status') return 'active_status';
        if (lowerStatus === 'escalated') return 'escalated';
        if (lowerStatus === 'abandoned') return 'abandoned';

        // Order status
        if (lowerStatus === 'pending') return 'pending';
        if (lowerStatus === 'confirmed') return 'confirmed';
        if (lowerStatus === 'preparing') return 'preparing';
        if (lowerStatus === 'ready') return 'ready';
        if (lowerStatus === 'processing') return 'processing';
        if (lowerStatus === 'completed') return 'completed';
        if (lowerStatus === 'cancelled') return 'cancelled';

        // Telegram
        if (lowerStatus === 'connected') return 'connected';
        if (lowerStatus === 'disconnected') return 'disconnected';
        if (lowerStatus === 'not connected') return 'disconnected';

        // Alert priority
        if (lowerStatus === 'high') return 'high';
        if (lowerStatus === 'medium') return 'medium';
        if (lowerStatus === 'low') return 'low';

        // Intent
        if (lowerStatus === 'intent') return 'intent';
    }

    // Default fallback
    return 'active';
};

const StatusBadge = ({
    status,
    label,
    icon: CustomIcon,
    className,
    iconClassName,
    showIcon = false,
    children,
    ...props
}) => {
    const configKey = getConfigKey(status);
    const config = STATUS_CONFIG[configKey] || STATUS_CONFIG.active;

    const Icon = CustomIcon || config.icon;

    // Determine display label
    let displayLabel = label || children;

    // If no label provided, try to get it from config or format the status
    if (!displayLabel) {
        if (typeof status === 'boolean') {
            displayLabel = status ? 'Active' : 'Inactive';
        } else if (typeof status === 'string') {
            // Use config label if available, otherwise format the string
            displayLabel = config.label || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        } else {
            displayLabel = '';
        }
    }

    return (
        <Badge
            variant={config.variant}
            className={cn('text-[10px] sm:text-xs font-medium gap-1', config.className, className)}
            {...props}
        >
            {showIcon && Icon && (
                <Icon className={cn(config.iconClassName || 'h-3 w-3', iconClassName)} />
            )}
            {displayLabel}
        </Badge>
    );
};

export { StatusBadge, STATUS_CONFIG, getConfigKey };