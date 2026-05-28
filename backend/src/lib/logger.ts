import pino from "pino";
import { ENV } from "./env.js";

export const logger = pino({
  level: ENV.NODE_ENV === "production" ? "info" : "debug",
  transport:
    ENV.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss" },
        }
      : undefined,
  redact: {
    paths: ["req.headers.cookie", "req.headers.authorization", "*.password"],
    censor: "[REDACTED]",
  },
});
