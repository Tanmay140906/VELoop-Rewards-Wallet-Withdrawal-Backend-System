import mongoose from 'mongoose';
import { ROLES, ACCOUNT_STATUSES } from '../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    // select: false => the hash is never returned unless explicitly requested
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUSES),
      default: ACCOUNT_STATUSES.ACTIVE,
    },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
