'use client';

import { Fragment, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BadgeCheckIcon,
    BellIcon,
    CreditCardIcon,
    LogOutIcon,
    Bell,
    Boxes,
    Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import ThemeToggle from '@/components/shared/ThemeToggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const emptySubscribe = (callback) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
};

const getBusinessTypeSnapshot = () => localStorage.getItem('businessType') || 'RESTAURANT';
const getBusinessTypeServerSnapshot = () => 'RESTAURANT';

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

// Breadcrumb configuration
const breadcrumbConfig = {
    '/ecommerce': 'Dashboard',
    '/restaurant': 'Dashboard',
    '/ai-analytics': 'AI Analytics',
    '/business-analytics': 'Business Analytics',
    '/categories': 'Categories',
    '/conversations': 'Conversations',
    '/customers': 'Customers',
    '/products': 'Products',
    '/products/new': 'New Product',
    '/products/[productId]/edit': 'Edit Product',
    '/menu': 'Menu',
    '/menu/new': 'New Menu Item',
    '/menu/[id]': 'Edit Menu Item',
    '/deals': 'Deals',
    '/deals/new': 'New Deal',
    "/deals/[id]": 'Edit Deal',
    '/settings': 'Settings',
    '/settings/info': 'Business Info',
    '/settings/knowledge': 'Business Knowledge',
    '/settings/profile': 'My Profile',
    '/settings/telegram': 'Telegram',
    '/orders': 'Orders',
    '/orders/[orderId]': 'Order Details',
    '/onboarding/business-type': 'Business Type',
    '/onboarding/business-info': 'Business Info',
    '/onboarding/business-knowledge': 'Business Knowledge',
    '/onboarding/telegram-connect': 'Connect Telegram',
};

const getBreadcrumbs = (pathname) => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];
    let currentPath = '';

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        currentPath += `/${segment}`;

        // Handle dynamic routes
        const matchingKey = Object.keys(breadcrumbConfig).find(key => {
            if (key.includes('[')) {
                const pattern = key.replace(/\[[^\]]+\]/g, '[^/]+');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(currentPath);
            }

            return key === currentPath;
        });

        if (matchingKey) {
            breadcrumbs.push({
                path: currentPath,
                label: breadcrumbConfig[matchingKey],
            });

            continue;
        }

        // Check whether this segment is a dynamic parameter
        const isDynamicSegment = Object.keys(breadcrumbConfig).some(key => {
            const configSegments = key.split('/').filter(Boolean);

            if (configSegments.length <= i) {
                return false;
            }

            const configSegment = configSegments[i];

            return (
                configSegment.startsWith('[') &&
                configSegment.endsWith(']')
            );
        });

        // Don't add dynamic IDs to breadcrumbs
        if (isDynamicSegment) {
            continue;
        }

        const label =
            segment.charAt(0).toUpperCase() + segment.slice(1);

        breadcrumbs.push({
            path: currentPath,
            label,
        });
    }

    return breadcrumbs;
};

export const Navbar = () => {
    const pathname = usePathname();

    // See the useSyncExternalStore helpers above for why this isn't a
    // useState + useEffect pair.
    const user = useSyncExternalStore(emptySubscribe, getUserSnapshot, getUserServerSnapshot);
    const businessType = useSyncExternalStore(
        emptySubscribe,
        getBusinessTypeSnapshot,
        getBusinessTypeServerSnapshot
    );
    const breadcrumbs = getBreadcrumbs(pathname);
    const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/sign-in';
    };

    // Check if current path is onboarding
    const isOnboarding = pathname?.includes('/onboarding');

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-sidebar px-4 sm:px-6">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <SidebarTrigger className="h-9 w-9 rounded-lg hover:bg-accent hover:text-accent-foreground" />

                <nav className="hidden sm:flex" aria-label="Breadcrumb">
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => {
                                const isLast = index === breadcrumbs.length - 1 || !item.path;
                                return (
                                    <Fragment key={`${item.label}-${index}`}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="font-semibold text-foreground">
                                                    {item.label}
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink
                                                    render={
                                                        <Link
                                                            href={item.path}
                                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            {item.label}
                                                        </Link>
                                                    }
                                                />
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator />}
                                    </Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </nav>

                <span className="text-sm font-semibold text-foreground sm:hidden">
                    {pageTitle}
                </span>
            </div>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
                <div className="rounded-md">
                    <ThemeToggle />
                </div>

                {!isOnboarding && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full hover:bg-accent"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {user?.name?.substring(0, 2)?.toUpperCase() || 'US'}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            }
                        />
                        <DropdownMenuContent
                            align="end"
                            sideOffset={10}
                            className="w-56 bg-card border-border"
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
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-md"
                                    render={
                                        <Link href="/settings/telegram">
                                            <Bell className="mr-2 h-4 w-4" />
                                            Telegram Settings
                                        </Link>
                                    }
                                />
                                <DropdownMenuItem
                                    className="cursor-pointer rounded-md"
                                    render={
                                        <Link href="/settings/knowledge">
                                            <Boxes className="mr-2 h-4 w-4" />
                                            Business Knowledge
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
                )}
            </div>
        </header>
    );
};