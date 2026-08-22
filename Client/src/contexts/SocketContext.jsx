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
        // Get the API URL without any path
        const SOCKET_URL = 'http://localhost:5000';

        console.log('🔌 Connecting to socket at:', SOCKET_URL);

        // Initialize socket connection - NO namespace (just the base URL)
        const socketInstance = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            // Add these for better debugging
            autoConnect: true,
            forceNew: true,
        });

        socketRef.current = socketInstance;

        // Connection event handlers
        socketInstance.on('connect', () => {
            console.log('🔌 Socket connected successfully');
            setIsConnected(true);

            // Join business room if businessId exists
            const businessId = localStorage.getItem('businessId');
            if (businessId) {
                console.log('📢 Joining business room:', businessId);
                socketInstance.emit('join-business', businessId);
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        socketInstance.on('reconnect', () => {
            console.log('🔄 Socket reconnected');
            setIsConnected(true);

            // Re-join business room
            const businessId = localStorage.getItem('businessId');
            if (businessId) {
                socketInstance.emit('join-business', businessId);
            }
        });

        setSocket(socketInstance);

        // Cleanup on unmount
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
                let businessId = localStorage.getItem('businessId');
                if (!businessId) {
                    const res = await api.get('/business');
                    if (res.data?.success && res.data?.data?.id) {
                        businessId = res.data.data.id;
                        localStorage.setItem('businessId', businessId);
                    }
                }
                if (businessId) {
                    console.log('📢 Auto-joining business room:', businessId);
                    socket.emit('join-business', businessId);
                }
            } catch (e) {
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
                console.log('💬 Joining conversation:', conversationId);
                socket.emit('join-conversation', conversationId);
            }
        },
        leaveConversation: (conversationId) => {
            if (socket && isConnected) {
                console.log('👋 Leaving conversation:', conversationId);
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