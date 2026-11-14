import { Component, inject, signal } from '@angular/core';
import { CacheStorageService, LocalStorageService, StorageError } from '@tobon/ngx-storage-manager';

interface LogEntry {
  time: string;
  ok: boolean;
  text: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly local = inject(LocalStorageService);
  private readonly cache = inject(CacheStorageService);

  protected readonly tab = signal<'local' | 'cache'>('local');
  protected readonly localKeys = signal<string[]>([]);
  protected readonly cacheNames = signal<string[]>([]);
  protected readonly resources = signal<string[]>([]);
  protected readonly log = signal<LogEntry[]>([]);

  constructor() {
    this.refreshLocal();
    void this.refreshCaches();
  }

  // ---------- LocalStorage ----------

  protected saveLocal(key: string, raw: string): void {
    this.runLocal('set', () => {
      this.need(key);
      this.local.set(key, this.parse(raw));
      return `"${key}" guardado`;
    });
  }

  protected getLocal(key: string): void {
    this.runLocal('get', () => {
      this.need(key);
      return this.local.get(key) ?? 'la clave no existe (null)';
    });
  }

  protected updateLocal(key: string, raw: string): void {
    this.runLocal('update', () => {
      this.need(key);
      this.local.update(key, () => this.parse(raw));
      return `"${key}" actualizado`;
    });
  }

  protected hasLocal(key: string): void {
    this.runLocal('has', () => {
      this.need(key);
      return this.local.has(key);
    });
  }

  protected removeLocal(key: string): void {
    this.runLocal('remove', () => {
      this.need(key);
      this.local.remove(key);
      return `"${key}" eliminado`;
    });
  }

  protected clearLocal(): void {
    this.runLocal('clear', () => {
      this.local.clear();
      return 'LocalStorage vaciado';
    });
  }

  // ---------- Cache Storage ----------

  protected createCache(name: string): void {
    this.runCache('createCache', async () => {
      this.need(name);
      await this.cache.createCache(name);
      return `caché "${name}" creado`;
    });
  }

  protected deleteCache(name: string): void {
    this.runCache('deleteCache', async () => {
      this.need(name);
      return (await this.cache.deleteCache(name)) ? `caché "${name}" eliminado` : 'el caché no existía';
    });
  }

  protected putResource(name: string, url: string, body: string): void {
    this.runCache('put', async () => {
      this.need(name, url);
      await this.cache.put(name, url, new Response(body));
      return `recurso "${url}" guardado en "${name}"`;
    });
  }

  protected getResource(name: string, url: string): void {
    this.runCache('get', async () => {
      this.need(name, url);
      const response = await this.cache.get(name, url);
      return response ? await response.text() : 'el recurso no existe (undefined)';
    });
  }

  protected removeResource(name: string, url: string): void {
    this.runCache('remove', async () => {
      this.need(name, url);
      return (await this.cache.remove(name, url)) ? `recurso "${url}" eliminado` : 'el recurso no existía';
    });
  }

  protected listResources(name: string): void {
    this.runCache('keys', async () => {
      this.need(name);
      const urls = await this.cache.keys(name);
      this.resources.set(urls);
      return `${urls.length} recurso(s) en "${name}"`;
    });
  }

  protected clearLog(): void {
    this.log.set([]);
  }

  // ---------- Utilidades internas ----------

  private runLocal(action: string, operation: () => unknown): void {
    try {
      this.addLog(true, action, operation());
    } catch (error) {
      this.addLog(false, action, error);
    }
    this.refreshLocal();
  }

  private runCache(action: string, operation: () => Promise<unknown>): void {
    void (async () => {
      try {
        this.addLog(true, action, await operation());
      } catch (error) {
        this.addLog(false, action, error);
      }
      await this.refreshCaches();
    })();
  }

  private refreshLocal(): void {
    this.localKeys.set(this.local.keys().sort());
  }

  private async refreshCaches(): Promise<void> {
    try {
      this.cacheNames.set((await this.cache.listCaches()).sort());
    } catch (error) {
      this.cacheNames.set([]);
      this.addLog(false, 'listCaches', error);
    }
  }

  private need(...values: string[]): void {
    if (values.some((value) => !value.trim())) {
      throw new Error('Completa los campos obligatorios');
    }
  }

  private parse(raw: string): unknown {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  private addLog(ok: boolean, action: string, result: unknown): void {
    const text = `${action}: ${ok ? this.format(result) : this.describe(result)}`;
    const entry: LogEntry = { time: new Date().toLocaleTimeString(), ok, text };
    this.log.update((entries) => [entry, ...entries].slice(0, 50));
  }

  private format(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private describe(error: unknown): string {
    if (error instanceof StorageError) {
      const cause = error.cause instanceof Error ? ` (${error.cause.message})` : '';
      return `StorageError: ${error.message}${cause}`;
    }
    return error instanceof Error ? error.message : String(error);
  }
}