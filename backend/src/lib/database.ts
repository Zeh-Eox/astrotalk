import mongoose from "mongoose";
import { ENV } from "./env.js";

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(ENV.MONGO_URI);

    console.log(
      `MongoDB Connected: ${mongoose.connection.host}`
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("MongoDB connect failed:", error.message);
    } else {
      console.error("MongoDB connect failed:", error);
    }

    process.exit(1);
  }
};