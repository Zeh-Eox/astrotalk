import mongoose from "mongoose";
import {ENV} from "./env.js";

export const connectDatabase = async () => {
    try {
        const { MONGO_URI } = ENV;
        if (!MONGO_URI) {
            throw new Error("MongoDB URI is required");
        }

        const databaseConnexion =  await mongoose.connect(MONGO_URI)
        console.log("MongoDB Connected : " + databaseConnexion.connection.host)
    } catch (error) {
        console.error("MongoDB Connect failed: " + error)
        process.exit(1)
    }
}