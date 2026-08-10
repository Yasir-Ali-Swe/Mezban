"use client"
import { useState } from "react";
import { SidebarProvider as BaseSidebarProvider } from '@/components/ui/sidebar'

const Provider = ({ children, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <BaseSidebarProvider open={open} onOpenChange={setOpen}>
            {children}
        </BaseSidebarProvider>
    )
}

export default Provider