const BLOCKED_QUERY_OPERATIONS = [
  'updateOne',
  'updateMany',
  'replaceOne',
  'findOneAndUpdate',
  'findOneAndReplace',
  'findOneAndDelete',
  'deleteOne',
  'deleteMany',
];

/**
 * Makes a schema append-only: records can be inserted but never updated
 * or deleted through Mongoose. Used for the ledger and the audit log.
 *
 * Corrections must be new records (e.g. a CORRECTION entry), never edits.
 * (In tests, clean up with Model.collection.deleteMany({}) which bypasses these hooks.)
 */
export const enforceAppendOnly = (schema, modelName) => {
  const message = `${modelName} records are append-only and cannot be modified or deleted.`;

  BLOCKED_QUERY_OPERATIONS.forEach((operation) => {
    schema.pre(operation, async function blockQueryMutation() {
      throw new Error(message);
    });
  });

  // Document-level equivalents: doc.updateOne() / doc.deleteOne()
  ['updateOne', 'deleteOne'].forEach((operation) => {
    schema.pre(operation, { document: true, query: false }, async function blockDocumentMutation() {
      throw new Error(message);
    });
  });

  // Re-saving an existing document would silently edit it.
  schema.pre('save', async function blockResave() {
    if (!this.isNew) {
      throw new Error(message);
    }
  });
};
