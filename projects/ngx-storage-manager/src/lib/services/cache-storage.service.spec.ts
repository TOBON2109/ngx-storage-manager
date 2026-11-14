import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StorageError } from '../models/storage-error.model';
import { CacheStorageService } from './cache-storage.service';

type Req = RequestInfo | URL;

const urlOf = (request: Req): string =>
  request instanceof Request ? request.url : String(request);

class FakeCache {
  private readonly store = new Map<string, Response>();

  async put(request: Req, response: Response): Promise<void> {
    this.store.set(urlOf(request), response);
  }

  async add(request: Req): Promise<void> {
    this.store.set(urlOf(request), new Response('descargado'));
  }

  async delete(request: Req): Promise<boolean> {
    return this.store.delete(urlOf(request));
  }

  async match(request: Req): Promise<Response | undefined> {
    return this.store.get(urlOf(request));
  }

  async keys(): Promise<Request[]> {
    return [...this.store.keys()].map((url) => new Request(url));
  }
}

class FakeCacheStorage {
  private readonly caches = new Map<string, FakeCache>();

  async open(name: string): Promise<FakeCache> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new FakeCache());
    }
    return this.caches.get(name) as FakeCache;
  }

  async has(name: string): Promise<boolean> {
    return this.caches.has(name);
  }

  async delete(name: string): Promise<boolean> {
    return this.caches.delete(name);
  }

  async keys(): Promise<string[]> {
    return [...this.caches.keys()];
  }

  async match(request: Req, options?: { cacheName?: string }): Promise<Response | undefined> {
    const cache = this.caches.get(options?.cacheName ?? '');
    return cache?.match(request);
  }
}

describe('CacheStorageService', () => {
  const URL_A = 'https://example.com/api/a';
  const URL_B = 'https://example.com/api/b';
  let service: CacheStorageService;

  beforeEach(() => {
    vi.stubGlobal('caches', new FakeCacheStorage());
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheStorageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('administración de cachés', () => {
    it('createCache debe crear un caché y no fallar si ya existe', async () => {
      await service.createCache('c1');
      await service.createCache('c1');

      expect(await service.listCaches()).toEqual(['c1']);
    });

    it('hasCache debe indicar si el caché existe', async () => {
      await service.createCache('c1');

      expect(await service.hasCache('c1')).toBe(true);
      expect(await service.hasCache('c2')).toBe(false);
    });

    it('deleteCache debe eliminar un caché completo', async () => {
      await service.createCache('c1');

      expect(await service.deleteCache('c1')).toBe(true);
      expect(await service.deleteCache('c1')).toBe(false);
      expect(await service.listCaches()).toEqual([]);
    });
  });

  describe('administración de recursos', () => {
    it('put y get deben guardar y recuperar una respuesta', async () => {
      await service.put('c1', URL_A, new Response('hola'));

      const response = await service.get('c1', URL_A);

      expect(await response?.text()).toBe('hola');
    });

    it('get debe devolver undefined si el recurso no existe', async () => {
      await service.createCache('c1');

      expect(await service.get('c1', URL_A)).toBeUndefined();
    });

    it('has debe indicar si el recurso existe', async () => {
      await service.put('c1', URL_A, new Response('x'));

      expect(await service.has('c1', URL_A)).toBe(true);
      expect(await service.has('c1', URL_B)).toBe(false);
    });

    it('add debe descargar y guardar el recurso', async () => {
      await service.add('c1', URL_A);

      const response = await service.get('c1', URL_A);

      expect(await response?.text()).toBe('descargado');
    });

    it('remove debe eliminar un recurso', async () => {
      await service.put('c1', URL_A, new Response('x'));

      expect(await service.remove('c1', URL_A)).toBe(true);
      expect(await service.remove('c1', URL_A)).toBe(false);
      expect(await service.has('c1', URL_A)).toBe(false);
    });

    it('keys debe listar las URLs almacenadas', async () => {
      await service.put('c1', URL_A, new Response('a'));
      await service.put('c1', new Request(URL_B), new Response('b'));

      expect((await service.keys('c1')).sort()).toEqual([URL_A, URL_B]);
    });
  });

  describe('manejo de errores', () => {
    it('debe lanzar StorageError si Cache Storage no está disponible', async () => {
      vi.stubGlobal('caches', undefined);

      await expect(service.createCache('c1')).rejects.toThrow(StorageError);
      await expect(service.createCache('c1')).rejects.toThrow(
        'Cache Storage no está disponible en este entorno',
      );
    });

    describe('cuando las operaciones nativas fallan', () => {
      beforeEach(() => {
        const fail = () => Promise.reject(new Error('boom'));
        vi.stubGlobal('caches', {
          open: fail,
          keys: fail,
          has: fail,
          delete: fail,
          match: fail,
        });
      });

      const operations: [string, (s: CacheStorageService) => Promise<unknown>][] = [
        ['createCache', (s) => s.createCache('c1')],
        ['listCaches', (s) => s.listCaches()],
        ['hasCache', (s) => s.hasCache('c1')],
        ['deleteCache', (s) => s.deleteCache('c1')],
        ['put', (s) => s.put('c1', URL_A, new Response('x'))],
        ['add', (s) => s.add('c1', URL_A)],
        ['get', (s) => s.get('c1', URL_A)],
        ['has', (s) => s.has('c1', URL_A)],
        ['remove', (s) => s.remove('c1', URL_A)],
        ['keys', (s) => s.keys('c1')],
      ];

      it.each(operations)('%s debe lanzar StorageError con la causa original', async (_, run) => {
        let thrown: unknown;
        try {
          await run(service);
        } catch (error) {
          thrown = error;
        }

        expect(thrown).toBeInstanceOf(StorageError);
        expect(((thrown as StorageError).cause as Error).message).toBe('boom');
      });
    });
  });
});