import jwt from 'jsonwebtoken';
import config from '../config/env.js';

const ALGORITHM = 'HS256';

/**
 * The token only carries the user id (the "sub" claim).
 * Role and account status are always re-read from the database,
 * so a stale or tampered token can never grant extra privileges.
 */
export const signToken = (user) =>
  jwt.sign({}, config.jwtSecret, {
    subject: user._id.toString(),
    expiresIn: config.jwtExpiresIn,
    algorithm: ALGORITHM,
  });

export const verifyToken = (token) =>
  jwt.verify(token, config.jwtSecret, { algorithms: [ALGORITHM] });
