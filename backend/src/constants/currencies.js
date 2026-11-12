/**
 * Whitelist of wallet currencies.
 * - code:  value stored in the ledger and sent by clients (e.g. "VES")
 * - field: the matching balance field on the Wallet document
 * - label: human-friendly name used in messages (e.g. "Insufficient VEs balance.")
 */
export const CURRENCIES = Object.freeze({
  VES: Object.freeze({ code: 'VES', field: 'ves', label: 'VEs' }),
  SVES: Object.freeze({ code: 'SVES', field: 'sves', label: 'SVEs' }),
  GEMS: Object.freeze({ code: 'GEMS', field: 'gems', label: 'Gems' }),
  TOKENS: Object.freeze({ code: 'TOKENS', field: 'tokens', label: 'Tokens' }),
  SPINS: Object.freeze({ code: 'SPINS', field: 'spins', label: 'Spins' }),
});

export const CURRENCY_CODES = Object.freeze(Object.keys(CURRENCIES));
