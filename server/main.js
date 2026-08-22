import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";
import { PORT } from "./config/env.js";
import { clerkMiddleware } from "@clerk/express";
import apiRoutes from "./routes/index.js";
import { setupSocketHandlers } from "./socket/socket.js";
import { startTelegramPolling } from "./controllers/telegram.controller.js";
import { FRONTEND_URL } from "./config/env.js"

const app = express();
const server = createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  },
  // Optimize for production
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Store io instance for use in controllers
app.set("io", io);

// Setup socket handlers & background Telegram poller
setupSocketHandlers(io);
startTelegramPolling(io);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(clerkMiddleware());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api", apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
const port = PORT || 5000;
server.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
  console.log(`🔌 Socket.io server is ready`);
});

export { io };