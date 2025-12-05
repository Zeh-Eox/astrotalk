import express from "express";
import dotenv from "dotenv";
import path from "path"
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js"
import messagesRoutes from "./routes/message.route.js"
import {connectDatabase} from "./lib/database.js";

dotenv.config();

const app = express();
const __dirname = path.resolve();

const PORT = process.env.PORT || 3000;

app.use(express.json()); // req.body access in controllers
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/messages', messagesRoutes);

if(process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*", (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}

app.listen(PORT, () => {
    console.log("Server running on port: " + PORT)
    connectDatabase()
})