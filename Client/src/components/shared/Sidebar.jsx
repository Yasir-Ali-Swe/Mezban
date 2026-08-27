// components/Sidebar.jsx
'use client';

import { useState, useSyncExternalStore, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Boxes,
    LayoutDashboard,
    Building2,
    BarChart3,
    CreditCard,
    User,
    Settings,
    BadgeCheckIcon,
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
    Bot,
    Package,
    Tags,
    Truck,
    Warehouse,
    Receipt,
    ShoppingCart,
    Users,
    FileText,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Store,
    Utensils,
    Pizza,
    Coffee,
    TrendingUp,
    MessageSquare,
    ShoppingBag,
    Layers,
    UserCog,
    Sparkles,
    Database,
    Send,
    BotMessageSquare,
    ChefHat,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sidebar as SidebarContainer,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    useSidebar,
} from '@/components/ui/sidebar';

const emptySubscribe = (callback) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
};



let cachedUserRaw;
let cachedUser = null;
const getUserSnapshot = () => {
    const raw = localStorage.getItem('user');
    if (raw === cachedUserRaw) return cachedUser;
    cachedUserRaw = raw;
    if (!raw) {
        cachedUser = null;
        return cachedUser;
    }
    try {
        cachedUser = JSON.parse(raw);
    } catch {
        cachedUser = null;
    }
    return cachedUser;
};
const getUserServerSnapshot = () => null;

const ICONS = {
    LayoutDashboard,
    Building2,
    BarChart3,
    CreditCard,
    User,
    Settings,
    Bot,
    Package,
    Tags,
    Truck,
    Warehouse,
    Receipt,
    ShoppingCart,
    Users,
    FileText,
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Store,
    Utensils,
    Pizza,
    Coffee,
    TrendingUp,
    MessageSquare,
    ShoppingBag,
    Layers,
    UserCog,
    Sparkles,
    Database,
    Send
};

const getDashboardRoutes = () => {
    return [
        {
            path: '/restaurant',
            label: 'Dashboard',
            icon: 'LayoutDashboard',
            section: 'main',
        },
        {
            path: '/analytics',
            label: 'Analytics',
            icon: 'TrendingUp',
            section: 'main',
            children: [
                { path: '/business-analytics', label: 'Business Analytics' },
                { path: '/ai-analytics', label: 'AI Analytics' },
            ]
        },
        {
            path: '/menu',
            label: 'Menu',
            icon: 'Utensils',
            section: 'main',
        },
        {
            path: '/deals',
            label: 'Deals',
            icon: 'Tags',
            section: 'main',
        },
        {
            path: '/categories',
            label: 'Categories',
            icon: 'Layers',
            section: 'main',
        },
        {
            path: '/orders',
            label: 'Orders',
            icon: 'ShoppingBag',
            section: 'main',
        },
        {
            path: '/customers',
            label: 'Customers',
            icon: 'Users',
            section: 'main',
        },
        {
            path: '/conversations',
            label: 'Conversations',
            icon: 'MessageSquare',
            section: 'main',
        },
        {
            path: '/settings-group',
            label: 'Settings',
            icon: 'Settings',
            section: 'account',
            children: [
                { path: '/settings/knowledge', label: 'Business Knowledge' },
                { path: '/settings/telegram', label: 'Telegram' },
            ]
        },
        {
            path: '/profile-group',
            label: 'Profile',
            icon: 'User',
            section: 'account',
            children: [
                { path: '/settings/profile', label: 'My Profile' },
                { path: '/settings/info', label: 'Business Profile' },
            ]
        },
    ];
};

export const Sidebar = () => {
    const pathname = usePathname();
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const user = useSyncExternalStore(
        emptySubscribe,
        getUserSnapshot,
        getUserServerSnapshot
    );

    // Memoize routes
    const routes = useMemo(() => getDashboardRoutes(), []);

    const mainRoutes = useMemo(() => routes.filter(route => route.section === 'main'), [routes]);
    const accountRoutes = useMemo(() => routes.filter(route => route.section === 'account'), [routes]);

    const isPathActive = useCallback((path) => {
        if (!path) return false;
        // Handle dynamic routes
        const pathPattern = path.replace(/\[[^\]]+\]/g, '[^/]+');
        const regex = new RegExp(`^${pathPattern}$`);
        return regex.test(pathname) || pathname.startsWith(path + '/');
    }, [pathname]);

    // Initialize open dropdown based on current path - using useMemo to avoid state update warning
    const initialOpenDropdown = useMemo(() => {
        const activeParent = routes.find(
            (route) =>
                route.children?.length > 0 &&
                route.children.some((child) => isPathActive(child.path))
        );
        return activeParent?.path ?? null;
    }, [routes, isPathActive]);

    const [openDropdown, setOpenDropdown] = useState(initialOpenDropdown);
    const [prevPathname, setPrevPathname] = useState(pathname);

    if (pathname !== prevPathname) {
        setPrevPathname(pathname);
        const activeParent = routes.find(
            (route) =>
                route.children?.length > 0 &&
                route.children.some((child) => isPathActive(child.path))
        );
        setOpenDropdown(activeParent?.path ?? null);
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/sign-in';
    };

    const renderRouteItem = (route) => {
        const Icon = ICONS[route.icon] || LayoutDashboard;
        const hasSubItems = route.children && route.children.length > 0;

        if (hasSubItems) {
            const isGroupActive = route.children.some((child) => isPathActive(child.path));
            const isOpen = openDropdown === route.path;

            return (
                <Collapsible
                    key={route.path}
                    open={isOpen}
                    onOpenChange={(open) => setOpenDropdown(open ? route.path : null)}
                    className="group/collapsible"
                >
                    <SidebarMenuItem>
                        <CollapsibleTrigger
                            render={
                                <SidebarMenuButton
                                    isActive={isGroupActive}
                                    tooltip={isCollapsed ? route.label : ''}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{route.label}</span>
                                    {isOpen ? (
                                        <ChevronUp className="ml-auto h-4 w-4" />
                                    ) : (
                                        <ChevronDown className="ml-auto h-4 w-4" />
                                    )}
                                </SidebarMenuButton>
                            }
                        />

                        <CollapsibleContent>
                            <SidebarMenuSub>
                                {route.children.map((child) => {
                                    if (child.path.includes('[')) return null;
                                    return (
                                        <SidebarMenuSubItem key={child.path}>
                                            <SidebarMenuSubButton
                                                isActive={pathname === child.path}
                                                render={
                                                    <Link href={child.path}>
                                                        <span>{child.label}</span>
                                                    </Link>
                                                }
                                            />
                                        </SidebarMenuSubItem>
                                    );
                                })}
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            );
        }

        if (route.path.includes('[')) return null;

        return (
            <SidebarMenuItem key={route.path}>
                <SidebarMenuButton
                    isActive={isPathActive(route.path)}
                    tooltip={isCollapsed ? route.label : ''}
                    render={
                        <Link href={route.path}>
                            <Icon className="h-4 w-4" />
                            <span>{route.label}</span>
                        </Link>
                    }
                />
            </SidebarMenuItem>
        );
    };

    return (
        <SidebarContainer collapsible="icon" variant="sidebar">
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-2 px-2 py-1">
                    {!isCollapsed && (
                        <span className="text-lg font-semibold text-sidebar-foreground">
                            Mezban
                        </span>
                    )}
                    <Utensils className="h-6 w-6 text-primary" />
                </div>
            </SidebarHeader>

            <SidebarContent className="scrollbarHide">
                <SidebarGroup>
                    {!isCollapsed && (
                        <SidebarGroupLabel className="text-muted-foreground uppercase tracking-wider text-xs">
                            Main
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {mainRoutes.map(renderRouteItem)}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {accountRoutes.length > 0 && (
                    <SidebarGroup>
                        {!isCollapsed && (
                            <SidebarGroupLabel className="text-muted-foreground uppercase tracking-wider text-xs">
                                Accounts
                            </SidebarGroupLabel>
                        )}
                        <SidebarGroupContent>
                            <SidebarMenu className="gap-1.5">
                                {accountRoutes.map(renderRouteItem)}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                    >
                                        <Avatar className="h-8 w-8 rounded-lg shrink-0">
                                            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                                            <AvatarFallback className="rounded-lg">
                                                {user?.name?.substring(0, 2)?.toUpperCase() || 'US'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {!isCollapsed && (
                                            <div className="grid flex-1 text-left text-sm leading-tight truncate">
                                                <span className="truncate font-medium">{user?.name || 'User'}</span>
                                                <span className="truncate text-xs text-muted-foreground capitalize">
                                                    {user?.role?.replace('_', ' ') || 'Admin'}
                                                </span>
                                            </div>
                                        )}
                                    </SidebarMenuButton>
                                }
                            />

                            <DropdownMenuContent
                                align="end"
                                side={isCollapsed ? 'right' : 'top'}
                                sideOffset={8}
                                className="w-56"
                            >
                                <DropdownMenuGroup>
                                    <DropdownMenuItem
                                        className="cursor-pointer rounded-md"
                                        render={
                                            <Link href="/settings/profile">
                                                <BadgeCheckIcon className="mr-2 h-4 w-4" />
                                                My Profile
                                            </Link>
                                        }
                                    />
                                    <DropdownMenuItem
                                        className="cursor-pointer rounded-md"
                                        render={
                                            <Link href="/settings/info">
                                                <Building2 className="mr-2 h-4 w-4" />
                                                Business Info
                                            </Link>
                                        }
                                    />
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-md"
                                >
                                    <LogOutIcon className="mr-2 h-4 w-4" />
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </SidebarContainer>
    );
};