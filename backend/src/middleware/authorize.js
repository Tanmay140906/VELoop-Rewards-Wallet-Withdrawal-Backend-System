import AppError from '../utils/AppError.js';

/** Allows the request only if req.user has one of the given roles. Use AFTER authenticate. */
export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401, 'AUTH_REQUIRED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN'),
      );
    }

    return next();
  };
