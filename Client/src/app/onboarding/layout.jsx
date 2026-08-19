import React from 'react'
import { AuthGuard } from '@/components/providers/AuthGuard'

const layout = ({ children }) => {
    return (
        <AuthGuard mode="onboarding">
            <div className="flex h-screen w-full overflow-hidden">
                <div className="flex flex-1 flex-col overflow-hidden">
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}

export default layout