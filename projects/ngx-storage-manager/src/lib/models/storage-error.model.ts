/**
 * Error lanzado por los servicios de la librería cuando una operación de almacenamiento falla.
 */
export class StorageError extends Error {
  /**
   * @param message Descripción del error.
   * @param cause Error original que provocó la falla (opcional).
   */
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}