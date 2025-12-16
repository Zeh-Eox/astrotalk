import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
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

    const decoded = jwt.verify(
      token,
      ENV.JWT_SECRET
    ) as JwtPayload;

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    req.user = user;
    next();
  } catch (error: unknown) {
    console.error("Error in protectRoute", error);

    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
