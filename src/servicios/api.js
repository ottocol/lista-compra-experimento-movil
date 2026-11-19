import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tynmtgjjapyxukbxxpoc.supabase.co',
  'sb_publishable_J6r6CiO19PjO5sAHXMd6mA_AS1ZF9pj'
)

async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw new Error('Error al hacer login: ' + error.message)
  return data // { user, session }
}


async function logout() {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw new Error('Error al cerrar sesión: ' + error.message)
}

//Devuelve la sesión actual o null si no hay usuario autenticado
async function getSesion() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

async function obtenerProductos() {
  if (!await getSesion()) return []

  const { data, error } = await supabase
    .from('lista')
    .select('id, nombre, comprado, usuario')
    .order('id')

  if (error) throw new Error('Error al obtener productos: ' + error.message)
  return data
}

//Crea un producto y devuelve el objeto creado (con su id asignado por la BD)
async function crearProducto(nombre) {
  const session = await getSesion()
  if (!session) return

  const { data, error } = await supabase
    .from('lista')
    .insert({ nombre, comprado: false, usuario: session.user.id })
    .select('id, nombre, comprado, usuario')
    .single()

  if (error) throw new Error('Error al crear producto: ' + error.message)
  return data
}

async function borrarProducto(id) {
  if (!await getSesion()) return

  const { error } = await supabase
    .from('lista')
    .delete()
    .eq('id', id)

  if (error) throw new Error('Error al borrar producto: ' + error.message)
}

async function setComprado(id, valor) {
  if (!await getSesion()) return

  const { error } = await supabase
    .from('lista')
    .update({ comprado: valor })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

async function setNombre(id, nombre) {
  if (!await getSesion()) return

  const { error } = await supabase
    .from('lista')
    .update({ nombre })
    .eq('id', id)

  if (error) throw new Error('Error al editar producto: ' + error.message)
}

//PLAN B para la demo: con ?red=mala en la URL cada búsqueda espera entre 0 y 2 s
//antes de salir. Es una simulación: en una red real el desorden lo causa sobre todo
//que unas respuestas son más pesadas o más lentas de calcular que otras
//(el retardo también se puede cancelar con la misma señal que la petición)
async function simularRed(signal) {
  if (!new URLSearchParams(location.search).has('red')) return
  await new Promise((resolve, reject) => {
    const t = setTimeout(resolve, Math.random() * 2000)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(signal.reason)
    }, { once: true })
  })
}

//Busca productos del catálogo cuyo nombre contiene el texto.
//Pedimos solo las columnas que se muestran y solo las que caben en pantalla,
//y aceptamos una señal para poder cancelar la petición.
//Si se cancela, lanza un AbortError, igual que haría fetch
async function buscarCatalogo(texto, signal) {
  await simularRed(signal)

  const { data, error } = await supabase
    .from('catalogo')
    .select('id, nombre, marca, formato')
    .ilike('nombre', `%${texto}%`)
    .order('nombre')
    .limit(8)
    .abortSignal(signal)

  //supabase-js cancela la petición de verdad, pero no lanza la excepción:
  //devuelve { error }. Si fue una cancelación, lanzamos el mismo AbortError
  //que lanzaría fetch, para que quien nos llama lo trate igual
  signal?.throwIfAborted()
  if (error) throw new Error('Error al buscar en el catálogo: ' + error.message)
  return data
}

async function getUsuario() {
  //esto es más rápido que getUser aunque podría ser que no estuviéramos autenticados correctamente en el servidor
  let result = await supabase.auth.getSession()
  if (result.data.session)
    return result.data.session.user
  else
    return null
}

export { login, logout, obtenerProductos, crearProducto, borrarProducto,
         setComprado, setNombre, getUsuario, buscarCatalogo }
