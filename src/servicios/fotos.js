//Fotos de producto para la demo de imágenes. No vienen de la base de datos:
//la app trae fotos para algunos productos habituales (public/fotos) y las
//busca por el nombre del producto. Si no hay foto, no se muestra ninguna.
const FOTOS = ['aceite', 'agua', 'arroz', 'cafe', 'cebollas', 'galletas', 'huevos', 'leche', 'lentejas',
               'manzanas', 'pan', 'pasta', 'patatas', 'platanos', 'queso', 'tomates', 'yogur', 'zanahorias']

//"Café molido (Marcilla, 250 g)" → "cafe molido (marcilla, 250 g)"
function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

//Devuelve el nombre del fichero de la foto (sin extensión) o null
export function fotoDe(nombre) {
  const texto = normalizar(nombre)
  return FOTOS.find((foto) => texto.includes(foto)) ?? null
}
