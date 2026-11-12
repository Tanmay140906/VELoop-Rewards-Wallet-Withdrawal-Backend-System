import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
  }),
);
app.use(express.json({ limit: '10kb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
