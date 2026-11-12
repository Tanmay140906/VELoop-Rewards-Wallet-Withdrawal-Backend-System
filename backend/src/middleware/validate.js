import AppError from '../utils/AppError.js';

/**
 * Validates req[source] ("body" | "query" | "params") against a Zod schema.
 * The CLEANED data (unknown fields removed, types converted, defaults applied)
 * is stored in req.validated[source]. Controllers must read from there,
 * never from the raw req.body / req.query.
 */
export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new AppError(errors[0].message, 400, 'VALIDATION_ERROR', errors));
    }

    req.validated = { ...req.validated, [source]: result.data };
    return next();
  };
