import jwt from "jsonwebtoken"
import User from "../models/user.model.js"
import { ENV } from "../lib/env.js"

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.headers.cookie
      ?.split("; ")
      .find((row) => row.startsWith("jwt="))
      ?.split("=")[1];

    if(!token) {
      console.log("Socket connection unauthorized: No token provided");
      return next(new Error("Unauthorized - No Token Provided"))
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if(!decoded) {
      console.log("Socket connection unauthorized: Invalid token");
      return next(new Error("Unauthorized - Invalid Token"))
    }

    const user = await User.findById(decoded.userId).select("-password")
    if(!user) {
      console.log("Socket connection unauthorized: User not found");
      return next(new Error("User Not Found"))
    }


    socket.user = user;
    socket.userId = user._id.toString();

    console.log(`Socket authenticated for user: ${user.fullName} (${user._id})`)

    next()
  } catch (error) {
    console.log("Error in socket authentication: ", error.message);
    next(new Error("Unauthorized - Authentication Failed"))
  }
}