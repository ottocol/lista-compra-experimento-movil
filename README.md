# Lista de la compra (Vue + Supabase)

Versión de escritorio con CRUD completo: listar, añadir, marcar como comprado, editar el nombre y borrar.

```bash
npm install
npm run dev
```

- `src/router.js`: rutas (`/` lista, `/login`) y guard que manda al login si no hay sesión
- `src/servicios/api.js`: todas las llamadas a Supabase
- `src/components/ListaCompra.vue`: carga la lista y gestiona los eventos de los hijos
- `src/components/Producto.vue`: un producto (pulsar = comprado/no comprado, ✎ = editar, x = borrar)
- `src/components/NuevoProducto.vue`: formulario para añadir

## Escanear códigos de barras (rama `demo/escaner`)

Botón «Escanear» en «Nuevo producto». Cada paso tiene su alternativa:

1. **Imagen:** vídeo de la cámara trasera con `getUserMedia`. El permiso se pide al pulsar el botón, no al cargar la página. Si no hay cámara o se deniega el permiso, se ofrece hacer una foto con `<input type="file" accept="image/*" capture>`, que no necesita permiso del navegador.
2. **Lectura:** `BarcodeDetector` nativo si existe (Chrome para Android); si no (Safari en iPhone, Firefox, Chrome de escritorio en Linux/Windows), un polyfill con ZXing compilado a WebAssembly (`barcode-detector`). El `.wasm` pesa unos 950 KB (415 KB comprimido): se descarga solo al pulsar «Escanear» y lo sirve la propia app, no un CDN. En pantalla se indica qué lector se está usando.
3. **Producto:** consulta a [Open Food Facts](https://openfoodfacts.github.io/openfoodfacts-server/api/) por código, pidiendo solo nombre, marca y cantidad. Los productos encontrados se guardan en caché (memoria y `localStorage`): el límite de 100 consultas por minuto es por IP y en clase se comparte. Si el producto no está, se ofrece escribirlo a mano.
4. **Limpieza:** al leer el código se apaga la cámara; al cerrar o salir se cancela la consulta pendiente.

El nombre encontrado rellena el campo, pero no se añade solo: el usuario lo revisa y pulsa «Añadir».

**Para probarlo** hace falta un contexto seguro (HTTPS o `localhost`), si no `getUserMedia` no existe:

- En el móvil por cable o en el emulador de Android: `adb reverse tcp:5173 tcp:5173` y abrir `http://localhost:5173`.
- En el simulador de iOS no hay cámara: sirve para ver la alternativa de la foto y el polyfill.

Código: `src/components/Escaner.vue`, `src/servicios/lectorCodigos.js`, `src/servicios/productosOFF.js`.

## Demo de PWA (rama `demo/pwa`)

Parte de `demo/escaner` y la convierte en PWA con [vite-plugin-pwa](https://vite-pwa-org.netlify.app/). Todo lo importante está en `vite.config.js`: la tabla de estrategias de la clase escrita como configuración.

| Recurso | Estrategia | Sin red |
| --- | --- | --- |
| HTML, JS, CSS, iconos | Precache generado en el build (con hash de cada fichero); cualquier navegación → `index.html` | La app abre |
| Lecturas de la tabla (GET `/rest/...` de Supabase) | Red primero, 3 s de tiempo límite, solo respuestas 200 | La última lista vista |
| Polyfill del escáner (`ponyfill-*.js`, `zxing_reader-*.wasm`) | Fuera del precache; caché primero la primera vez que se usa | Funciona si ya se usó una vez con red |
| Open Food Facts | Sin pasar por el service worker: la app ya guarda los productos encontrados en `localStorage` | Los códigos ya consultados; los nuevos, a mano |
| Login (`/auth/...`) y escrituras | Sin caché | Error (las escrituras fallan) |

Además: `AvisoVersion.vue` avisa cuando hay una versión nueva en espera, `App.vue` muestra «Sin conexión» y `logout()` borra la caché de datos (la clave de la caché es la URL, que es la misma para todos los usuarios).

El service worker solo se genera en el build: **`npm run build && npm run preview`**, no `npm run dev`.

1. **¿Es instalable?** DevTools → Application → Manifest. Chrome de escritorio muestra el icono de instalar en la barra de direcciones.
2. **¿Por qué no me llega la versión nueva?** Con la app abierta, cambia un texto (por ejemplo el `<h1>` de `App.vue`), `npm run build` (el `preview` puede seguir en marcha) y recarga: el texto no cambia, en Application → Service workers aparece el nuevo *waiting to activate* y la app muestra el aviso. «Recargar» del aviso lo activa.
3. **Sin conexión.** Application → Service workers → *Offline* (o Network → *Offline*; comprueba en el ensayo que las peticiones del service worker también se cortan). La app abre y la lista sale de la caché. Marcar un producto falla: la caché solo guarda lecturas.
4. **Al acabar:** Application → Storage → *Clear site data*. Si no, el service worker registrado en `localhost:4173` seguirá respondiendo a cualquier otro proyecto que sirvas en ese puerto.
