import React from 'react'
import { cookies } from 'next/headers'
import { Sidebar } from "@/components/shared/Sidebar"
import { Navbar } from "@/components/shared/Navbar"
import SidebarProvider from '@/components/shared/SidebarProvider'
import { AuthGuard } from '@/components/providers/AuthGuard'

const SIDEBAR_COOKIE_NAME = 'sidebar_state';
const Layout = async ({ children }) => {
    const cookieStore = await cookies();
    const sidebarCookie = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value;
    const defaultOpen = sidebarCookie === undefined ? true : sidebarCookie === 'true';

    return (
        <AuthGuard mode="dashboard">
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
        </AuthGuard>
    )
}

export default Layout