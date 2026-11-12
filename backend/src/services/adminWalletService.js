import { creditWallet, debitWallet } from './walletService.js';
import { logAudit } from './auditService.js';
import { runInTransaction } from '../utils/transaction.js';
import { AUDIT_ACTIONS } from '../constants/audit.js';

const CORRECTION_SOURCES = ['CORRECTION', 'CORRECTION_CREDIT'];

const auditActionFor = (source, defaultAction) =>
  CORRECTION_SOURCES.includes(source) ? AUDIT_ACTIONS.BALANCE_CORRECTION : defaultAction;

/**
 * Shared flow for manual wallet changes:
 * wallet change + ledger entry + audit log in ONE transaction.
 * An admin can never change a balance without it being logged.
 */
const applyAdminChange = async ({ operation, defaultAction, actor, input, context }) => {
  const { userId, currency, amount, source, description, referenceId } = input;

  return runInTransaction(undefined, async (session) => {
    const result = await operation(
      {
        userId,
        currency,
        amount,
        source,
        description,
        referenceId: referenceId ?? null,
        metadata: { performedBy: actor.id },
      },
      { session },
    );

    await logAudit(
      {
        actorId: actor.id,
        action: auditActionFor(source, defaultAction),
        targetUserId: userId,
        targetType: 'Wallet',
        referenceId: result.transaction.transactionId,
        metadata: {
          currency,
          amount,
          source,
          reason: description,
          balanceBefore: result.transaction.balanceBefore,
          balanceAfter: result.transaction.balanceAfter,
        },
        context,
      },
      { session },
    );

    return result;
  });
};

export const adminCreditWallet = ({ actor, input, context }) =>
  applyAdminChange({
    operation: creditWallet,
    defaultAction: AUDIT_ACTIONS.WALLET_CREDIT,
    actor,
    input,
    context,
  });

export const adminDebitWallet = ({ actor, input, context }) =>
  applyAdminChange({
    operation: debitWallet,
    defaultAction: AUDIT_ACTIONS.WALLET_DEBIT,
    actor,
    input,
    context,
  });
