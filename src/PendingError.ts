/**
 * This error is thrown by prescript when a `pending()` step is executed.
 * @public
 */
export class PendingError extends Error {
  public __prescriptPending = true

  constructor() {
    super('[pending]')
    this.name = 'PendingError'
  }
}

/**
 * Checks if the provided Error object is a PendingError, which is
 * thrown by the `pending()` step.
 *
 * @param e - The error to check.
 * @public
 */
export function isPendingError(e: any) {
  return !!(e && e.__prescriptPending)
}
