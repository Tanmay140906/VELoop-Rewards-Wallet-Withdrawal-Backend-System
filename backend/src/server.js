import app from './app.js';
import config from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

const start = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`[server] Listening on port ${config.port} (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
