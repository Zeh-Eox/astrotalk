import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import authRoutes from "./routes/auth.route.js";
import messagesRoutes from "./routes/message.route.js";
import { connectDatabase } from "./lib/database.js";
import { ENV } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { app, server } from "./lib/socket.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const PORT = ENV.PORT;
const rootDir = path.resolve();

app.use(pinoHttp({ logger }));
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: ENV.NODE_ENV === "production" ? undefined : false,
  })
);
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/messages", messagesRoutes);

if (ENV.NODE_ENV === "production") {
  const frontendDist = path.join(rootDir, "../frontend/dist");
  app.use(express.static(frontendDist));

  app.get("*", (_, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
} else {
  app.use(notFoundHandler);
}

app.use(errorHandler);

server.listen(PORT, () => {
  logger.info(`Server running on port: ${PORT}`);
  connectDatabase();
});
