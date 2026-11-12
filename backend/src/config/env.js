import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const REQUIRED_VARIABLES = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_VARIABLES.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn('[config] JWT_SECRET is shorter than 32 characters. Use a longer secret.');
}

const nodeEnv = process.env.NODE_ENV || 'development';

/**
 * Single source of truth for configuration.
 * Every other file imports from here - never read process.env directly.
 */
const config = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
});

export default config;
