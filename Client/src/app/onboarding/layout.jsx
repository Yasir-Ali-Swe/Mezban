import React from 'react'

const layout = ({ children }) => {
    return (
        <div className="flex h-screen w-full overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default layout