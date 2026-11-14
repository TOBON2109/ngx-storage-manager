import { Injectable } from '@angular/core';
import { StorageError } from '../models/storage-error.model';

/**
 * Servicio para administrar datos en LocalStorage con serialización JSON.
 * Soporta valores primitivos y objetos.
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  /**
   * Guarda un valor (primitivo u objeto) bajo una clave.
   * @param key Clave de almacenamiento.
   * @param value Valor a guardar.
   * @throws StorageError si el valor es undefined o el almacenamiento falla.
   */
  set<T>(key: string, value: T): void {
    if (value === undefined) {
      throw new StorageError(`No se puede guardar undefined en "${key}"`);
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new StorageError(`No se pudo guardar "${key}"`, error);
    }
  }

  /**
   * Obtiene un valor por clave.
   * @param key Clave a consultar.
   * @returns El valor deserializado, o null si la clave no existe.
   * @throws StorageError si el contenido almacenado no es JSON válido.
   */
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      throw new StorageError(`El valor de "${key}" no es JSON válido`, error);
    }
  }

  /**
   * Actualiza un valor existente aplicando una función.
   * @param key Clave a actualizar.
   * @param updater Función que recibe el valor actual y devuelve el nuevo.
   * @throws StorageError si la clave no existe.
   */
  update<T>(key: string, updater: (current: T) => T): void {
    const current = this.get<T>(key);
    if (current === null) {
      throw new StorageError(`La clave "${key}" no existe`);
    }
    this.set(key, updater(current));
  }

  /**
   * Indica si una clave existe.
   * @param key Clave a verificar.
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Elimina una clave. No falla si no existe.
   * @param key Clave a eliminar.
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /** Elimina todas las claves almacenadas. */
  clear(): void {
    localStorage.clear();
  }

  /** Devuelve todas las claves almacenadas. */
  keys(): string[] {
    return Object.keys(localStorage);
  }
}