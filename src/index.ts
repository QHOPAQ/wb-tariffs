import express, { Request, Response } from "express";
import { config } from "./config";
import { logger } from "./utils/logger";
import { checkDb } from "./db";
import { initWbTariffsCron } from "./jobs/fetchTariffs.job";
import { startGoogleSync } from "./jobs/syncSheets.job";

async function bootstrap() {
  await checkDb();

  // запуск cron задач
  initWbTariffsCron();
  startGoogleSync();

  logger.info("Cron jobs initialized");

  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`);
  });

  const shutdown = () => {
    logger.info("Graceful shutdown...");
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap();