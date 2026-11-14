import { Injectable } from '@angular/core';
import { StorageError } from '../models/storage-error.model';

/**
 * Servicio para administrar cachés y recursos mediante Cache Storage del navegador.
 */
@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  /**
   * Crea un caché. Si ya existe, no hace nada.
   * @param cacheName Nombre del caché.
   * @throws StorageError si Cache Storage no está disponible o la operación falla.
   */
  async createCache(cacheName: string): Promise<void> {
    const storage = this.storage();
    await this.execute(`No se pudo crear el caché "${cacheName}"`, () => storage.open(cacheName));
  }

  /**
   * Lista los nombres de todos los cachés existentes.
   * @throws StorageError si la operación falla.
   */
  async listCaches(): Promise<string[]> {
    const storage = this.storage();
    return this.execute('No se pudieron listar los cachés', () => storage.keys());
  }

  /**
   * Indica si existe un caché.
   * @param cacheName Nombre del caché.
   * @throws StorageError si la operación falla.
   */
  async hasCache(cacheName: string): Promise<boolean> {
    const storage = this.storage();
    return this.execute(`No se pudo verificar el caché "${cacheName}"`, () =>
      storage.has(cacheName),
    );
  }

  /**
   * Elimina un caché completo.
   * @param cacheName Nombre del caché.
   * @returns true si el caché existía y fue eliminado.
   * @throws StorageError si la operación falla.
   */
  async deleteCache(cacheName: string): Promise<boolean> {
    const storage = this.storage();
    return this.execute(`No se pudo eliminar el caché "${cacheName}"`, () =>
      storage.delete(cacheName),
    );
  }

  /**
   * Guarda una respuesta asociada a una petición. Crea el caché si no existe.
   * @param cacheName Nombre del caché.
   * @param request URL o petición que identifica el recurso.
   * @param response Respuesta a almacenar.
   * @throws StorageError si la operación falla.
   */
  async put(cacheName: string, request: RequestInfo | URL, response: Response): Promise<void> {
    const storage = this.storage();
    await this.execute(`No se pudo guardar el recurso en "${cacheName}"`, async () => {
      const cache = await storage.open(cacheName);
      await cache.put(request, response);
    });
  }

  /**
   * Descarga un recurso con fetch y lo guarda en el caché.
   * @param cacheName Nombre del caché.
   * @param request URL o petición a descargar.
   * @throws StorageError si la descarga o el guardado fallan.
   */
  async add(cacheName: string, request: RequestInfo | URL): Promise<void> {
    const storage = this.storage();
    await this.execute(`No se pudo agregar el recurso a "${cacheName}"`, async () => {
      const cache = await storage.open(cacheName);
      await cache.add(request);
    });
  }

  /**
   * Consulta un recurso almacenado.
   * @param cacheName Nombre del caché.
   * @param request URL o petición del recurso.
   * @returns La respuesta almacenada, o undefined si no existe.
   * @throws StorageError si la operación falla.
   */
  async get(cacheName: string, request: RequestInfo | URL): Promise<Response | undefined> {
    const storage = this.storage();
    return this.execute(`No se pudo consultar el recurso en "${cacheName}"`, () =>
      storage.match(request, { cacheName }),
    );
  }

  /**
   * Indica si un recurso existe en un caché.
   * @param cacheName Nombre del caché.
   * @param request URL o petición del recurso.
   * @throws StorageError si la operación falla.
   */
  async has(cacheName: string, request: RequestInfo | URL): Promise<boolean> {
    return (await this.get(cacheName, request)) !== undefined;
  }

  /**
   * Elimina un recurso de un caché.
   * @param cacheName Nombre del caché.
   * @param request URL o petición del recurso.
   * @returns true si el recurso existía y fue eliminado.
   * @throws StorageError si la operación falla.
   */
  async remove(cacheName: string, request: RequestInfo | URL): Promise<boolean> {
    const storage = this.storage();
    return this.execute(`No se pudo eliminar el recurso de "${cacheName}"`, async () => {
      const cache = await storage.open(cacheName);
      return cache.delete(request);
    });
  }

  /**
   * Lista las URLs de los recursos almacenados en un caché.
   * @param cacheName Nombre del caché.
   * @throws StorageError si la operación falla.
   */
  async keys(cacheName: string): Promise<string[]> {
    const storage = this.storage();
    return this.execute(`No se pudieron listar los recursos de "${cacheName}"`, async () => {
      const cache = await storage.open(cacheName);
      const requests = await cache.keys();
      return requests.map((request) => request.url);
    });
  }

  private storage(): CacheStorage {
    if (typeof caches === 'undefined') {
      throw new StorageError('Cache Storage no está disponible en este entorno');
    }
    return caches;
  }

  private async execute<T>(message: string, operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw new StorageError(message, error);
    }
  }
}