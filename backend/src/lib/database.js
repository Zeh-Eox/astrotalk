import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        const databaseConnexion =  await mongoose.connect(process.env.MONGO_URI)
        console.log("MongoDB Connected : " + databaseConnexion.connection.host)
    } catch (error) {
        console.error("MongoDB Connect failed: " + error)
        process.exit(1)
    }
}