import mongoose from 'mongoose';

// Balances are always whole numbers (never floats) and never negative.
const balanceField = () => ({
  type: Number,
  default: 0,
  min: 0,
  validate: { validator: Number.isInteger, message: '{PATH} must be a whole number.' },
});

const walletSchema = new mongoose.Schema(
  {
    // One wallet per user (unique index)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    ves: balanceField(),
    sves: balanceField(),
    gems: balanceField(),
    tokens: balanceField(),
    spins: balanceField(),
  },
  { timestamps: true },
);

export default mongoose.model('Wallet', walletSchema);
