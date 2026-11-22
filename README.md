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

## Demo de imágenes (ramas `demo/fotos-rota` y `demo/fotos-arreglada`)

La app trae fotos para 18 productos habituales (`public/fotos`); se buscan por el nombre del producto (`src/servicios/fotos.js`).

1. Añade esos productos a tu lista con `supabase/productos_con_foto.sql` (cambia el email por el tuyo).
2. `npm run build && npm run preview`, DevTools en modo dispositivo, red 3G y el filtro **Img** del panel Network.
3. **Rota:** cada fila carga la foto original (2400 × 1800 px, unos 1,4 MB) para enseñarla a 64 px. Se descargan las 18 al cargar la página, se vean o no: unos 26 MB. Sin `width`/`height`, la lista además «salta» al llegar cada foto.
4. **Arreglada** (`git diff demo/fotos-rota demo/fotos-arreglada`): miniaturas de 64, 128 y 192 px con `srcset` (`1x`, `2x`, `3x`), `width` y `height`, `loading="lazy"` y `alt`.

Las fotos de ejemplo son sintéticas, pero pesan como fotos de verdad. Para usar fotos tuyas (por ejemplo, hechas con el móvil), sustituye los ficheros de `public/fotos/originales` manteniendo el nombre y ejecuta `python scripts/miniaturas.py` (necesita Pillow).
