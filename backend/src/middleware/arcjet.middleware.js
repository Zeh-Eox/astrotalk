import arcjetConfig from "../lib/arcjet.js";
import {isSpoofedBot} from "@arcjet/inspect";

export const arcjetProtection = async (req, res, next) => {
    try {
        const decision = await arcjetConfig.protect(req);
        if (decision.isDenied()) {
            if (decision.reason.isRateLimit()) {
                return res.status(429).json({
                    success: false,
                    message: "Too many requests - Try again later",
                })
            }
            else if (decision.reason.isBot()) {
                return res.status(403).json({
                    success: false,
                    message: "Bot access denied",
                })
            } else {
                return res.status(403).json({
                    success: false,
                    message: "Access denied by security policy",
                })
            }
        }

        if (decision.results.some(isSpoofedBot)) {
            return res.status(403).json({
                success: false,
                message: "Malicious bot activity detected",
            })
        }

        next();
    } catch (e) {
        console.error("Arcjet protection error", e);
        next();
    }
}