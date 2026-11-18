import { createRouter, createWebHistory } from 'vue-router'
import { getUsuario } from './servicios/api.js'
import Login from './components/Login.vue'
import ListaCompra from './components/ListaCompra.vue'

const routes = [
  { path: '/', name: 'lista', component: ListaCompra, meta: { requiereLogin: true } },
  { path: '/login', name: 'login', component: Login },
  //cualquier otra URL, a la lista (si no hay sesión, el guard mandará al login)
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

//Antes de cada navegación comprobamos si hay sesión
router.beforeEach(async (to) => {
  const usuario = await getUsuario()
  //ruta protegida sin sesión: al login, recordando adónde quería ir
  if (to.meta.requiereLogin && !usuario)
    return { name: 'login', query: to.fullPath != '/' ? { volver: to.fullPath } : {} }
  //ya autenticado: no tiene sentido mostrar el login
  if (to.name === 'login' && usuario)
    return { name: 'lista' }
})

export default router
