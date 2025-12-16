import { Request, Response, NextFunction } from "express";
import arcjetConfig from "../lib/arcjet.js";
import { isSpoofedBot } from "@arcjet/inspect";

export const arcjetProtection = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const decision = await arcjetConfig.protect(req);

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        res.status(429).json({
          success: false,
          message: "Too many requests - Try again later",
        });
        return;
      }

      if (decision.reason.isBot()) {
        res.status(403).json({
          success: false,
          message: "Bot access denied",
        });
        return;
      }

      res.status(403).json({
        success: false,
        message: "Access denied by security policy",
      });
      return;
    }

    if (decision.results.some(isSpoofedBot)) {
      res.status(403).json({
        success: false,
        message: "Malicious bot activity detected",
      });
      return;
    }

    next();
  } catch (error: unknown) {
    console.error("Arcjet protection error", error);
    next(error);
  }
};
