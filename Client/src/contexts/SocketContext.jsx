'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '@/lib/axios';

const SocketContext = createContext(null);

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        const SOCKET_URL =
            process.env.NEXT_PUBLIC_SOCKET_URL ||
            process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ||
            'http://localhost:5000';

        const socketInstance = io(SOCKET_URL, {
            transports: ['polling', 'websocket'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
            setIsConnected(true);
            const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : null;
            if (businessId) {
                socketInstance.emit('join-business', businessId);
            }
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketInstance.on('connect_error', () => {
            setIsConnected(false);
        });

        socketInstance.on('reconnect', () => {
            setIsConnected(true);
            const businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : null;
            if (businessId) {
                socketInstance.emit('join-business', businessId);
            }
        });

        setSocket(socketInstance);

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    // Sync businessId from API and join business room automatically
    useEffect(() => {
        if (!socket || !isConnected) return;

        const syncBusinessRoom = async () => {
            try {
                let businessId = typeof window !== 'undefined' ? localStorage.getItem('businessId') : null;
                if (!businessId) {
                    const res = await api.get('/business');
                    if (res.data?.success && res.data?.data?.id) {
                        businessId = res.data.data.id;
                        if (typeof window !== 'undefined') {
                            localStorage.setItem('businessId', businessId);
                        }
                    }
                }
                if (businessId) {
                    socket.emit('join-business', businessId);
                }
            } catch {
                // Ignore if unauthenticated
            }
        };

        syncBusinessRoom();
    }, [socket, isConnected]);

    const value = {
        socket,
        isConnected,
        joinConversation: (conversationId) => {
            if (socket && isConnected) {
                socket.emit('join-conversation', conversationId);
            }
        },
        leaveConversation: (conversationId) => {
            if (socket && isConnected) {
                socket.emit('leave-conversation', conversationId);
            }
        },
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};