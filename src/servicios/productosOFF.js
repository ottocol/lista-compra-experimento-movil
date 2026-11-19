//Consulta de productos por código de barras en Open Food Facts
//(base de datos abierta, sin clave). Documentación:
//https://openfoodfacts.github.io/openfoodfacts-server/api/

const URL_PRODUCTO = 'https://world.openfoodfacts.org/api/v2/product/'
//pedimos solo lo que vamos a mostrar: la ficha completa es enorme
const CAMPOS = 'product_name,product_name_es,brands,quantity'

//Caché de productos encontrados. Un código siempre es el mismo producto, y el
//límite (100 consultas por minuto y por IP) se comparte con toda la red:
//en clase, con todo el alumnado detrás de la misma IP, se nota
const cache = new Map()

function leerCache(codigo) {
  if (cache.has(codigo)) return cache.get(codigo)
  try {
    const guardado = localStorage.getItem('off:' + codigo)
    if (guardado) {
      const producto = JSON.parse(guardado)
      cache.set(codigo, producto)
      return producto
    }
  } catch {
    //sin localStorage (modo privado, etc.): seguimos solo con la memoria
  }
  return null
}

function guardarCache(producto) {
  cache.set(producto.codigo, producto)
  try {
    localStorage.setItem('off:' + producto.codigo, JSON.stringify(producto))
  } catch {
    //no pasa nada si no se puede guardar
  }
}

//Devuelve { codigo, nombre, marca, formato } o null si el producto no está.
//Acepta una señal para poder cancelar (lanza AbortError, como fetch)
export async function productoPorCodigo(codigo, signal) {
  const enCache = leerCache(codigo)
  if (enCache) return enCache

  const resp = await fetch(`${URL_PRODUCTO}${encodeURIComponent(codigo)}?fields=${CAMPOS}`, { signal })
  if (resp.status === 429)
    throw new Error('Demasiadas consultas a Open Food Facts. Prueba dentro de un minuto.')
  //si el producto no existe, la respuesta lleva status 0 (y a veces un HTTP 404)
  const datos = await resp.json().catch(() => null)
  if (!resp.ok && resp.status !== 404)
    throw new Error('Open Food Facts no responde (' + resp.status + ')')
  if (!datos || datos.status !== 1 || !datos.product) return null

  const p = datos.product
  const nombre = (p.product_name_es || p.product_name || '').trim()
  if (!nombre) return null //está registrado, pero sin nombre: no nos sirve

  const producto = {
    codigo,
    nombre,
    marca: (p.brands || '').split(',')[0].trim(),
    formato: (p.quantity || '').trim(),
  }
  guardarCache(producto)
  return producto
}

//"Leche entera (Pascual, 1 l)"
export function textoProducto(p) {
  const extra = [p.marca, p.formato].filter(Boolean).join(', ')
  return extra ? `${p.nombre} (${extra})` : p.nombre
}
