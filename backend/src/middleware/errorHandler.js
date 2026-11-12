import AppError from '../utils/AppError.js';

const send = (res, statusCode, message, code, errors) =>
  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(errors ? { errors } : {}),
  });

/**
 * Central error handler. Known errors (AppError) are returned as-is.
 * Everything else is logged on the server and the client only sees a
 * generic message - database errors and stack traces never leak.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return send(res, err.statusCode, err.message, err.code, err.details);
  }

  if (err?.type === 'entity.parse.failed') {
    return send(res, 400, 'Invalid JSON in request body.', 'INVALID_JSON');
  }

  if (err?.type === 'entity.too.large') {
    return send(res, 413, 'Request body is too large.', 'PAYLOAD_TOO_LARGE');
  }

  if (err?.code === 11000) {
    return send(res, 409, 'This record already exists.', 'DUPLICATE_RECORD');
  }

  if (err?.name === 'CastError') {
    return send(res, 400, 'Invalid identifier.', 'INVALID_ID');
  }

  console.error('[error]', err);
  return send(res, 500, 'Something went wrong. Please try again later.', 'INTERNAL_ERROR');
};
