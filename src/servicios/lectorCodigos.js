//Lectura de códigos de barras con la API BarcodeDetector.
//Si el navegador la trae (Chrome para Android, por ejemplo) usamos la nativa.
//Si no (Safari en iPhone, Firefox...), cargamos un polyfill: ZXing compilado
//a WebAssembly, con la misma API. El .wasm pesa casi 1 MB (unos 400 KB
//comprimido), así que solo se descarga la primera vez que hace falta

//los formatos de los productos de supermercado
const FORMATOS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

let promesa = null   //guardamos la promesa: dos llamadas seguidas no cargan el polyfill dos veces
let tipo = null

//'nativo' o 'polyfill' (null si aún no se ha creado el detector)
export function tipoDetector() {
  return tipo
}

export function obtenerDetector() {
  if (!promesa) {
    promesa = crearDetector().catch((error) => {
      promesa = null    //si falla (por ejemplo, sin red), se podrá reintentar
      throw error
    })
  }
  return promesa
}

async function crearDetector() {
  //1. ¿Lo trae el navegador y lee los formatos que necesitamos?
  if ('BarcodeDetector' in window) {
    try {
      const soportados = await window.BarcodeDetector.getSupportedFormats()
      const formatos = FORMATOS.filter((f) => soportados.includes(f))
      if (formatos.length > 0) {
        tipo = 'nativo'
        return new window.BarcodeDetector({ formats: formatos })
      }
    } catch {
      //si falla, seguimos con el polyfill
    }
  }

  //2. Polyfill cargado bajo demanda (code splitting: es otro chunk).
  //El .wasm lo servimos nosotros en vez de pedirlo a un CDN
  const [{ BarcodeDetector, prepareZXingModule }, { default: urlWasm }] = await Promise.all([
    import('barcode-detector/ponyfill'),
    import('zxing-wasm/reader/zxing_reader.wasm?url'),
  ])
  prepareZXingModule({
    overrides: {
      locateFile: (path, prefix) => (path.endsWith('.wasm') ? urlWasm : prefix + path),
    },
  })
  tipo = 'polyfill'
  return new BarcodeDetector({ formats: FORMATOS })
}
