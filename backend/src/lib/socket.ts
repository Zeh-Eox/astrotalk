import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const userSocketMap = new Map<string, Set<string>>();

export function getReceiverSocketId(
  userId: string
): Set<string> | undefined {
  return userSocketMap.get(userId);
}

io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.fullName);

  const userId = socket.userId.toString();

  const sockets = userSocketMap.get(userId) ?? new Set<string>();
  sockets.add(socket.id);
  userSocketMap.set(userId, sockets);

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.user.fullName);

    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }

    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };
