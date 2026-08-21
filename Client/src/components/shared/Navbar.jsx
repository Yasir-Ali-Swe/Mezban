'use client';
import { Fragment } from "react";
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

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

const breadcrumbConfig = {
    '/restaurant': { label: 'Dashboard' },
    '/ai-analytics': { label: 'AI Analytics' },
    '/business-analytics': { label: 'Business Analytics' },
    '/categories': { label: 'Categories' },
    '/conversations': { label: 'Conversations' },
    '/customers': { label: 'Customers' },
    '/menu': { label: 'Menu' },
    '/menu/new': { label: 'New Menu Item' },
    '/menu/[id]': { label: 'Edit Menu Item' },
    '/deals': { label: 'Deals' },
    '/deals/new': { label: 'New Deal' },
    '/deals/[id]': { label: 'Edit Deal' },
    '/settings': { label: 'Settings', navigable: false }, // no page at /settings
    '/settings/info': { label: 'Business Info' },
    '/settings/knowledge': { label: 'Business Knowledge' },
    '/settings/profile': { label: 'My Profile' },
    '/settings/telegram': { label: 'Telegram' },
    '/orders': { label: 'Orders' },
    '/orders/[orderId]': { label: 'Order Details' },
    '/onboarding/business-info': { label: 'Business Info' },
    '/onboarding/business-knowledge': { label: 'Business Knowledge' },
    '/onboarding/telegram-connect': { label: 'Connect Telegram' },
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
            const config = breadcrumbConfig[matchingKey];
            breadcrumbs.push({
                path: currentPath,
                label: config.label,
                navigable: config.navigable !== false, // default true unless explicitly false
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
            navigable: true,
        });
    }

    return breadcrumbs;
};

export const Navbar = () => {
    const pathname = usePathname();

    const user = useSyncExternalStore(emptySubscribe, getUserSnapshot, getUserServerSnapshot);
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
                                // Only render an actual link when this crumb is the
                                // last one is handled separately (always plain text),
                                // and when the route is marked navigable.
                                const isClickable = !isLast && item.navigable !== false;

                                return (
                                    <Fragment key={`${item.label}-${index}`}>
                                        <BreadcrumbItem>
                                            {isLast ? (
                                                <BreadcrumbPage className="font-semibold text-foreground">
                                                    {item.label}
                                                </BreadcrumbPage>
                                            ) : isClickable ? (
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
                                            ) : (
                                                <BreadcrumbPage className="text-muted-foreground cursor-default">
                                                    {item.label}
                                                </BreadcrumbPage>
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
                    <div className="flex items-center gap-2 pl-2">
                        <UserButton />
                    </div>
                )}
            </div>
        </header>
    );
};