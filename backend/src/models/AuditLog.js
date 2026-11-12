import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../constants/audit.js';
import { enforceAppendOnly } from '../utils/appendOnly.js';

/** Who did what, to whom, and when. Append-only. */
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
    targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    targetType: { type: String, default: null }, // e.g. "Wallet", "Withdrawal"
    referenceId: { type: String, default: null }, // e.g. transactionId / withdrawalId
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, minimize: false },
);

auditLogSchema.index({ targetUserId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ referenceId: 1 });

enforceAppendOnly(auditLogSchema, 'AuditLog');

export default mongoose.model('AuditLog', auditLogSchema);
