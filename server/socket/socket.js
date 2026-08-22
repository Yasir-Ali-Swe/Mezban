// socket/socket.js
import prisma from "../config/prisma.js";

// Store active connections for monitoring
const activeConnections = new Map();

export const setupSocketHandlers = (io) => {
    io.on("connection", (socket) => {
        console.log(`✅ User connected: ${socket.id}`);
        activeConnections.set(socket.id, { connectedAt: new Date() });

        // Join business room
        socket.on("join-business", (businessId) => {
            if (businessId) {
                socket.join(`business-${businessId}`);
                console.log(`📢 Socket ${socket.id} joined business-${businessId}`);

                // Store businessId on socket for cleanup
                socket.businessId = businessId;
            }
        });

        // Join specific conversation room
        socket.on("join-conversation", (conversationId) => {
            if (conversationId) {
                socket.join(`conversation-${conversationId}`);
                console.log(`💬 Socket ${socket.id} joined conversation-${conversationId}`);

                // Store conversationId on socket for cleanup
                socket.conversationId = conversationId;
            }
        });

        // Leave conversation room
        socket.on("leave-conversation", (conversationId) => {
            if (conversationId) {
                socket.leave(`conversation-${conversationId}`);
                console.log(`👋 Socket ${socket.id} left conversation-${conversationId}`);
                socket.conversationId = null;
            }
        });

        // Mark messages as read
        socket.on("mark-read", async ({ conversationId, messageId }) => {
            try {
                await prisma.message.update({
                    where: { id: messageId },
                    data: { readAt: new Date() },
                });

                // Notify others in the conversation
                socket.to(`conversation-${conversationId}`).emit("message-read", {
                    messageId,
                    conversationId,
                });
            } catch (error) {
                console.error("Error marking message as read:", error);
            }
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${socket.id}`);
            activeConnections.delete(socket.id);

            // Clean up rooms if needed
            if (socket.businessId) {
                socket.leave(`business-${socket.businessId}`);
            }
            if (socket.conversationId) {
                socket.leave(`conversation-${socket.conversationId}`);
            }
        });

        // Handle errors
        socket.on("error", (error) => {
            console.error(`Socket error for ${socket.id}:`, error);
        });
    });

    // Monitor connections
    setInterval(() => {
        console.log(`📊 Active connections: ${activeConnections.size}`);
    }, 60000); // Log every minute
};

// Helper function to emit new message - with null check
export const emitNewMessage = (io, conversationId, messageData) => {
    if (!io) {
        console.warn('⚠️ Socket.io not available, skipping emit');
        return;
    }

    // Emit to conversation room
    io.to(`conversation-${conversationId}`).emit("new-message", messageData);

    // Also emit to business room for conversation list updates
    if (messageData.businessId) {
        io.to(`business-${messageData.businessId}`).emit("conversation-updated", {
            conversationId,
            lastMessage: messageData.content,
            lastActivity: new Date().toISOString(),
            customerId: messageData.customer?.id,
            customerName: messageData.customer?.name,
        });
    }
};

// Helper function to emit new conversation - with null check
export const emitNewConversation = (io, businessId, conversationData) => {
    if (!io) {
        console.warn('⚠️ Socket.io not available, skipping emit');
        return;
    }
    io.to(`business-${businessId}`).emit("new-conversation", conversationData);
};

// Helper function to emit typing indicator - with null check
export const emitTyping = (io, conversationId, isTyping, userId) => {
    if (!io) {
        console.warn('⚠️ Socket.io not available, skipping emit');
        return;
    }
    io.to(`conversation-${conversationId}`).emit("typing-indicator", {
        conversationId,
        isTyping,
        userId,
        timestamp: new Date().toISOString(),
    });
};
// // socket/socket.js
// import prisma from "../config/prisma.js";

// // Store active connections for monitoring
// const activeConnections = new Map();

// export const setupSocketHandlers = (io) => {
//     io.on("connection", (socket) => {
//         console.log(`✅ User connected: ${socket.id}`);
//         activeConnections.set(socket.id, { connectedAt: new Date() });

//         // Join business room
//         socket.on("join-business", (businessId) => {
//             if (businessId) {
//                 socket.join(`business-${businessId}`);
//                 console.log(`📢 Socket ${socket.id} joined business-${businessId}`);

//                 // Store businessId on socket for cleanup
//                 socket.businessId = businessId;
//             }
//         });

//         // Join specific conversation room
//         socket.on("join-conversation", (conversationId) => {
//             if (conversationId) {
//                 socket.join(`conversation-${conversationId}`);
//                 console.log(`💬 Socket ${socket.id} joined conversation-${conversationId}`);

//                 // Store conversationId on socket for cleanup
//                 socket.conversationId = conversationId;
//             }
//         });

//         // Leave conversation room
//         socket.on("leave-conversation", (conversationId) => {
//             if (conversationId) {
//                 socket.leave(`conversation-${conversationId}`);
//                 console.log(`👋 Socket ${socket.id} left conversation-${conversationId}`);
//                 socket.conversationId = null;
//             }
//         });

//         // Mark messages as read
//         socket.on("mark-read", async ({ conversationId, messageId }) => {
//             try {
//                 await prisma.message.update({
//                     where: { id: messageId },
//                     data: { readAt: new Date() },
//                 });

//                 // Notify others in the conversation
//                 socket.to(`conversation-${conversationId}`).emit("message-read", {
//                     messageId,
//                     conversationId,
//                 });
//             } catch (error) {
//                 console.error("Error marking message as read:", error);
//             }
//         });

//         // Handle disconnection
//         socket.on("disconnect", () => {
//             console.log(`❌ User disconnected: ${socket.id}`);
//             activeConnections.delete(socket.id);

//             // Clean up rooms if needed
//             if (socket.businessId) {
//                 socket.leave(`business-${socket.businessId}`);
//             }
//             if (socket.conversationId) {
//                 socket.leave(`conversation-${socket.conversationId}`);
//             }
//         });

//         // Handle errors
//         socket.on("error", (error) => {
//             console.error(`Socket error for ${socket.id}:`, error);
//         });
//     });

//     // Monitor connections
//     setInterval(() => {
//         console.log(`📊 Active connections: ${activeConnections.size}`);
//     }, 60000); // Log every minute
// };

// // Helper function to emit new message
// export const emitNewMessage = (io, conversationId, messageData) => {
//     // Emit to conversation room
//     io.to(`conversation-${conversationId}`).emit("new-message", messageData);

//     // Also emit to business room for conversation list updates
//     if (messageData.businessId) {
//         io.to(`business-${messageData.businessId}`).emit("conversation-updated", {
//             conversationId,
//             lastMessage: messageData.content,
//             lastActivity: new Date().toISOString(),
//             customerId: messageData.customer?.id,
//             customerName: messageData.customer?.name,
//         });
//     }
// };

// // Helper function to emit new conversation
// export const emitNewConversation = (io, businessId, conversationData) => {
//     io.to(`business-${businessId}`).emit("new-conversation", conversationData);
// };

// // Helper function to emit typing indicator
// export const emitTyping = (io, conversationId, isTyping, userId) => {
//     io.to(`conversation-${conversationId}`).emit("typing-indicator", {
//         conversationId,
//         isTyping,
//         userId,
//         timestamp: new Date().toISOString(),
//     });
// };