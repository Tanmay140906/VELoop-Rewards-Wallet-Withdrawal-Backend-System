import AuditLog from '../models/AuditLog.js';

/**
 * Writes one audit record.
 * Pass { session } to write it inside the same transaction as the action it
 * describes - then the action and its audit record commit (or roll back) together.
 */
export const logAudit = async (entry, { session } = {}) => {
  const [record] = await AuditLog.create(
    [
      {
        actorId: entry.actorId ?? null,
        action: entry.action,
        targetUserId: entry.targetUserId ?? null,
        targetType: entry.targetType ?? null,
        referenceId: entry.referenceId ?? null,
        metadata: entry.metadata ?? {},
        ip: entry.context?.ip ?? null,
        userAgent: entry.context?.userAgent ?? null,
      },
    ],
    { session },
  );

  return record;
};
