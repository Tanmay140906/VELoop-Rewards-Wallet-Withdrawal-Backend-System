/** Extracts the details we store in audit logs from an Express request. */
export const getRequestContext = (req) => ({
  ip: req.ip ?? null,
  userAgent: req.get('user-agent') ?? null,
});
