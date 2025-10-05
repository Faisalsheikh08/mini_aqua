import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import dotenv from "dotenv";
import { connectToDB } from "./db";

dotenv.config();

// Railway compatibility
const PORT = parseInt(process.env.PORT || "5000", 10);

// Memory monitoring function
function checkMemoryUsage() {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

  if (heapUsedMB > 1500) {
    console.warn(
      ` HIGH MEMORY USAGE: ${heapUsedMB}MB / ${heapTotalMB}MB heap used`
    );
    if (global.gc) {
      console.log("Running garbage collection...");
      global.gc();
      const newMemUsage = process.memoryUsage();
      const newHeapUsedMB = Math.round(newMemUsage.heapUsed / 1024 / 1024);
      console.log(`Memory after GC: ${newHeapUsedMB}MB`);
    }
  }

  return { heapUsedMB, heapTotalMB };
}

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse)
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// Healthcheck (independent of DB)
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  });
});

// DB healthcheck
app.get("/api/db-health", async (_req, res) => {
  try {
    await connectToDB(1, 0); // single attempt just for checking
    res.status(200).json({ status: "db healthy" });
  } catch (err: any) {
    res.status(500).json({ status: "db not ready", error: err.message });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  throw err;
});

(async () => {
  try {
    // Initial memory check
    const initialMemory = checkMemoryUsage();
    log(`Starting server with ${initialMemory.heapUsedMB}MB heap usage`);

    // Set up memory monitoring
    setInterval(checkMemoryUsage, 60000);

    // Connect to DB before starting server
    await connectToDB();

    // Register routes
    const server = await registerRoutes(app);

    // Dev vs Prod
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start server
    const host = "0.0.0.0"; // required for Railway
    server.listen(PORT, host, () => {
      log(`Server running at http://${host}:${PORT}`);
      log(`Environment: ${process.env.NODE_ENV}`);
      log(
        `Database URL configured: ${process.env.DATABASE_URL ? "Yes" : "No"}`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1); // exit container if DB fails
  }
})();
