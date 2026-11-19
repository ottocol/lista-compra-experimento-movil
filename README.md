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

## Demo de búsqueda (rama `demo/busqueda-rota`)

1. Ejecuta `supabase/catalogo.sql` en el SQL Editor de Supabase: crea la tabla `catalogo` (unos 2100 productos ficticios) con lectura para usuarios autenticados. No toca la tabla `lista`.
2. `npm run dev`, DevTools → Network → **Slow 4G**, y escribe «leche» deprisa en «Nuevo producto».
3. La petición de «l» trae hasta 1000 filas (todas las columnas) y llega la última: las sugerencias no corresponden a lo escrito. Míralo en la columna *Size* y en el orden de llegada.
4. Plan B si en tu red no se desordena: añade `?red=mala` a la URL (retardo aleatorio simulado de 0 a 2 s por búsqueda).

El filtro «Buscar en mi lista» pide a Supabase los productos que coinciden con cada tecla, aunque la lista ya está entera en el cliente (míralo en el panel Network). Además guarda el texto en una variable: si el navegador descarta la pestaña (`chrome://discards`), al volver se pierde.

## La versión arreglada (rama `demo/busqueda-arreglada`)

`git diff demo/busqueda-rota demo/busqueda-arreglada` enseña exactamente los cambios:

- Autocompletado con *debounce* (300 ms), mínimo 2 letras y `AbortController`: cada tecla cancela la búsqueda anterior y solo se pinta la última.
- La consulta pide solo las columnas que se muestran y como mucho 8 filas (antes, `select('*')` sin límite y `slice` en el cliente).
- El filtro de la lista no hace peticiones: un `computed` filtra los productos que ya están en el cliente.
- El texto del filtro vive en la URL (`?q=leche`): sobrevive a la recarga y al descarte de la pestaña.
- `onUnmounted` limpia el temporizador y la petición pendiente.
