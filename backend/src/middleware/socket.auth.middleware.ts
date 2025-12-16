import jwt from "jsonwebtoken";
import type { Socket } from "socket.io";
import User from "../models/user.model.js";
import { ENV } from "../lib/env.js";
import type { JwtPayload } from "../types/jwt.js";

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  try {
    const cookieHeader = socket.handshake.headers.cookie;

    const token = cookieHeader
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    if (!token) {
      return next(new Error("Unauthorized - No Token Provided"));
    }

    const decoded = jwt.verify(
      token,
      ENV.JWT_SECRET
    ) as JwtPayload;

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return next(new Error("Unauthorized - User Not Found"));
    }

    socket.user = user;
    socket.userId = user._id;

    console.log(
      `Socket authenticated: ${user.fullName} (${socket.userId})`
    );

    next();
  } catch (error) {
    console.error("Socket auth error:", error);
    next(new Error("Unauthorized - Authentication Failed"));
  }
};
