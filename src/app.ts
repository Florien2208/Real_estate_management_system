import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { logger } from "./utils/logger.utils";
import appRoutes from "./routes";
import { setupSwagger } from "./config/swagger.config";
import { errorHandler } from "./middleware/errorHandler.middleware";

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:8080",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use("/api/v1", appRoutes);
setupSwagger(app);

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Resource not found",
  });
});
app.use(errorHandler)
// Error handler
// app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
//   logger.error(`Unhandled error: ${err.message}`);
//   res.status(500).json({
//     success: false,
//     error: "Server error",
//   });
// });

export default app;
