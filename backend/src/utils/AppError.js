/**
 * Error that is safe to show to the client.
 * Anything that is NOT an AppError is treated as an internal error
 * and is never exposed (see middleware/errorHandler.js).
 */
export default class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
