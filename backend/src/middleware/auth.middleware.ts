import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model.js";
import { ENV } from "../lib/env.js";
import type { JwtPayload } from "../types/jwt.js";

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    } catch (err) {
      const message =
        err instanceof jwt.TokenExpiredError
          ? "Unauthorized - Token expired"
          : "Unauthorized - Invalid token";
      res.status(401).json({ success: false, message });
      return;
    }

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in protectRoute", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
