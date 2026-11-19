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
