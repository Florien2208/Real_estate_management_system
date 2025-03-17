import { logger } from "@/utils/logger.utils";
import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/typescriptdb";

    // Set up event listeners BEFORE connecting
    mongoose.connection.on("connected", () => {
      logger.info("MongoDB connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    // Handle process termination
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed due to app termination");
      process.exit(0);
    });

    // Connect to MongoDB after setting up listeners
    await mongoose.connect(mongoURI);

    // // Add an immediate log (optional)
    // logger.info(`MongoDB initial connection successful`);
  } catch (error) {
    logger.error(`Database connection failed: ${error}`);
    process.exit(1);
  }
}
