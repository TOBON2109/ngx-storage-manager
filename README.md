# @tobon/ngx-storage-manager

Librería Angular para gestionar **LocalStorage** y **Cache Storage** del navegador con una API sencilla, tipada y consistente, sin tener que usar directamente las APIs nativas.

## Características

- `LocalStorageService`: guarda, consulta, actualiza y elimina valores primitivos y objetos (serialización JSON).
- `CacheStorageService`: crea y elimina cachés, guarda y consulta respuestas HTTP o recursos.
- `StorageError`: error propio que envuelve la causa original.
- Servicios listos para inyectar (`providedIn: 'root'`), sin configuración.
- Cobertura de pruebas del 100%.

## Instalación

```bash
npm install @tobon/ngx-storage-manager
```

Requiere Angular 21 o superior.

## Configuración

No necesita configuración. Inyecta los servicios donde los necesites:

```ts
import { Component, inject } from '@angular/core';
import { LocalStorageService, CacheStorageService } from '@tobon/ngx-storage-manager';

@Component({ selector: 'app-demo', template: '' })
export class DemoComponent {
  private readonly local = inject(LocalStorageService);
  private readonly cache = inject(CacheStorageService);
}
```

## LocalStorageService

| Método | Descripción |
| --- | --- |
| `set<T>(key, value)` | Guarda un valor. Lanza `StorageError` si es `undefined` o falla el almacenamiento. |
| `get<T>(key)` | Devuelve el valor o `null` si no existe. Lanza `StorageError` si el JSON es inválido. |
| `update<T>(key, updater)` | Actualiza un valor existente. Lanza `StorageError` si la clave no existe. |
| `has(key)` | Indica si la clave existe. |
| `remove(key)` | Elimina una clave. |
| `clear()` | Elimina todas las claves. |
| `keys()` | Lista todas las claves. |

```ts
this.local.set('token', 'abc123');
this.local.set('user', { id: 1, name: 'Juan' });

const user = this.local.get<{ id: number; name: string }>('user');

this.local.update<number>('visitas', (actual) => actual + 1);

this.local.has('token');   // true
this.local.remove('token');
this.local.clear();
```

## CacheStorageService

Todos los métodos son asíncronos (`Promise`).

| Método | Descripción |
| --- | --- |
| `createCache(cacheName)` | Crea un caché (no falla si ya existe). |
| `listCaches()` | Lista los nombres de los cachés. |
| `hasCache(cacheName)` | Indica si existe el caché. |
| `deleteCache(cacheName)` | Elimina un caché completo. Devuelve `true` si existía. |
| `put(cacheName, request, response)` | Guarda una respuesta asociada a una petición. |
| `add(cacheName, request)` | Descarga el recurso con `fetch` y lo guarda. |
| `get(cacheName, request)` | Devuelve la respuesta o `undefined`. |
| `has(cacheName, request)` | Indica si el recurso existe en el caché. |
| `remove(cacheName, request)` | Elimina un recurso. Devuelve `true` si existía. |
| `keys(cacheName)` | Lista las URLs almacenadas en el caché. |

```ts
await this.cache.createCache('api-cache');

await this.cache.put('api-cache', '/api/users', new Response(JSON.stringify([{ id: 1 }])));

const response = await this.cache.get('api-cache', '/api/users');
const users = await response?.json();

await this.cache.remove('api-cache', '/api/users');
await this.cache.deleteCache('api-cache');
```

## Manejo de errores

Las operaciones que fallan lanzan `StorageError`, con la causa original en `cause`:

```ts
import { StorageError } from '@tobon/ngx-storage-manager';

try {
  this.local.update<number>('no-existe', (n) => n + 1);
} catch (error) {
  if (error instanceof StorageError) {
    console.error(error.message, error.cause);
  }
}
```

## Notas

- Cache Storage solo está disponible en contextos seguros (HTTPS o `localhost`). Si no está disponible, los métodos lanzan `StorageError`.
- Los valores de `LocalStorageService` se guardan como JSON; `undefined`, funciones y símbolos no son soportados.

## Documentación técnica

Generada con Compodoc: ejecuta `npm run docs` en el repositorio.

## Licencia

MIT © Juan Esteban Tobón Díaz