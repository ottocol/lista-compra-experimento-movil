import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      //'prompt': la versión nueva del service worker se queda "en espera"
      //hasta que el usuario acepta recargar (componente AvisoVersion.vue)
      registerType: 'prompt',
      //los iconos del manifest ya entran por globPatterns
      includeManifestIcons: false,

      //el manifest se genera a partir de esto (dist/manifest.webmanifest)
      manifest: {
        name: 'Lista de la compra',
        short_name: 'Lista',
        description: 'Lista de la compra compartida (ADI)',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f6f2',
        theme_color: '#367b57',
        icons: [
          { src: '/icons/icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icono-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        //PRECACHE (el "shell"): la lista de ficheros se calcula en el build,
        //con un hash de cada uno. Si cambia un fichero, cambia sw.js y hay versión nueva.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        //El polyfill del escáner (ZXing en WebAssembly) no entra en el precache:
        //solo lo necesitan los navegadores sin BarcodeDetector (iPhone, Firefox...)
        //y el .wasm pesa casi 1 MB. Se guarda la primera vez que se usa (más abajo)
        globIgnores: ['**/ponyfill-*.js', '**/zxing_reader-*'],

        //cualquier navegación (/, /login, /?q=leche...) se responde con index.html
        //de la caché y el router de Vue hace el resto
        navigateFallback: '/index.html',

        //borra las cachés de precache de versiones anteriores
        cleanupOutdatedCaches: true,

        runtimeCaching: [
          {
            //DATOS: lecturas de la tabla (GET a la API REST de Supabase).
            //Red primero; si en 3 s no responde, lo último guardado.
            //Ojo: esta función no se ejecuta aquí; se copia como texto dentro de sw.js.
            //Por eso la URL va escrita tal cual: una constante de este fichero no existiría allí.
            urlPattern: ({ url }) => url.origin === 'https://tynmtgjjapyxukbxxpoc.supabase.co' && url.pathname.startsWith('/rest/'),
            method: 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'datos',
              networkTimeoutSeconds: 3,
              //solo respuestas correctas: un 401 o un 500 no se guarda
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            //POLYFILL DEL ESCÁNER: caché primero, la primera vez que se pulsa «Escanear».
            //Los nombres llevan un hash del contenido, así que un fichero guardado
            //nunca queda desactualizado: una versión nueva tiene otro nombre.
            urlPattern: ({ url }) => /\/assets\/(ponyfill|zxing_reader)-/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'escaner',
              expiration: { maxEntries: 6 },
              cacheableResponse: { statuses: [200] },
            },
          },
          //Las consultas a Open Food Facts tampoco pasan por aquí: la app ya guarda
          //en localStorage los productos encontrados (productosOFF.js).
          //Todo lo demás va directo a la red sin pasar por la caché:
          //login y sesión (/auth/...), y todas las escrituras (POST, PATCH, DELETE),
          //porque las rutas de arriba solo atienden peticiones GET.
        ],
      },
    }),
  ],
})
