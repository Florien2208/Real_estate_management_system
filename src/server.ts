import app from "./app";
import { connectDB } from "./config/connectDb.config";
import { logger } from "./utils/logger.utils";

const PORT = process.env.PORT || 3000;

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      logger.info(`API health check: http://localhost:${PORT}/health`);
    });
  } catch (error: any) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
