import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageError } from '../models/storage-error.model';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('set y get', () => {
    it('debe guardar y recuperar valores primitivos', () => {
      service.set('texto', 'hola');
      service.set('numero', 42);
      service.set('booleano', true);

      expect(service.get<string>('texto')).toBe('hola');
      expect(service.get<number>('numero')).toBe(42);
      expect(service.get<boolean>('booleano')).toBe(true);
    });

    it('debe guardar y recuperar objetos y arreglos', () => {
      const user = { id: 1, name: 'Juan', tags: ['a', 'b'] };

      service.set('user', user);
      service.set('lista', [1, 2, 3]);

      expect(service.get<typeof user>('user')).toEqual(user);
      expect(service.get<number[]>('lista')).toEqual([1, 2, 3]);
    });

    it('debe devolver null si la clave no existe', () => {
      expect(service.get('inexistente')).toBeNull();
    });

    it('debe lanzar StorageError si el valor es undefined', () => {
      expect(() => service.set('k', undefined)).toThrow(StorageError);
    });

    it('debe envolver el error nativo cuando falla el almacenamiento', () => {
      const nativeError = new Error('quota exceeded');
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw nativeError;
      });

      let thrown: unknown;
      try {
        service.set('k', 1);
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(StorageError);
      expect((thrown as StorageError).cause).toBe(nativeError);
    });

    it('debe lanzar StorageError si el contenido no es JSON válido', () => {
      localStorage.setItem('malo', '{no es json');

      expect(() => service.get('malo')).toThrow(StorageError);
    });
  });

  describe('update', () => {
    it('debe actualizar un valor existente', () => {
      service.set('contador', 1);

      service.update<number>('contador', (current) => current + 1);

      expect(service.get<number>('contador')).toBe(2);
    });

    it('debe lanzar StorageError si la clave no existe', () => {
      expect(() => service.update<number>('nada', (c) => c)).toThrow(StorageError);
    });
  });

  describe('has, remove, clear y keys', () => {
    it('has debe indicar si la clave existe', () => {
      service.set('a', 1);

      expect(service.has('a')).toBe(true);
      expect(service.has('b')).toBe(false);
    });

    it('remove debe eliminar una clave y no fallar si no existe', () => {
      service.set('a', 1);

      service.remove('a');
      service.remove('no-existe');

      expect(service.has('a')).toBe(false);
    });

    it('clear debe eliminar todas las claves', () => {
      service.set('a', 1);
      service.set('b', 2);

      service.clear();

      expect(service.keys()).toEqual([]);
    });

    it('keys debe devolver todas las claves', () => {
      service.set('a', 1);
      service.set('b', 2);

      expect(service.keys().sort()).toEqual(['a', 'b']);
    });
  });
});