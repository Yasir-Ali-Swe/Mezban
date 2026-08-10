import React from 'react'
import { cookies } from 'next/headers'
import { Sidebar } from "@/components/shared/Sidebar"
import { Navbar } from "@/components/shared/Navbar"
import SidebarProvider from '@/components/shared/SidebarProvider'

const SIDEBAR_COOKIE_NAME = 'sidebar_state';

// This stays a Server Component (no 'use client'), so we can read the
// cookie at request time with next/headers and hand the resolved value
// down as a prop. That's what lets SidebarProvider render identically
// on the server and on the client's first paint.
const Layout = async ({ children }) => {
    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value;
    const defaultOpen = sidebarCookie === undefined ? true : sidebarCookie === 'true';

    return (
        <SidebarProvider defaultOpen={defaultOpen}>
            <div className="flex h-screen w-full overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <Navbar />
                    <main className="flex-1 overflow-y-auto p-4 ">
                        {children}
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}

export default Layout