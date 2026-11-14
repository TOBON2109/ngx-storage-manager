import { describe, expect, it } from 'vitest';
import { StorageError } from './storage-error.model';

describe('StorageError', () => {
  it('debe ser una instancia de Error con nombre y mensaje', () => {
    const error = new StorageError('falló');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(StorageError);
    expect(error.name).toBe('StorageError');
    expect(error.message).toBe('falló');
    expect(error.cause).toBeUndefined();
  });

  it('debe conservar la causa original', () => {
    const cause = new Error('original');
    const error = new StorageError('falló', cause);

    expect(error.cause).toBe(cause);
  });
});