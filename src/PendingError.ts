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
 */
export function isPendingError(e: any) {
  return !!(e && e.__prescriptPending)
}
