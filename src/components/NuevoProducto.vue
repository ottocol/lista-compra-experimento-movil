<script setup>
    import { ref, watch, onUnmounted } from 'vue';
    import { buscarCatalogo } from '../servicios/api';

    const emit = defineEmits(["nuevo_prod"])
    const nombre = ref("")
    const sugerencias = ref([])

    const ESPERA_MS = 300       //debounce: esperamos a que el usuario deje de teclear
    const MIN_LETRAS = 2        //con una sola letra casi todo coincide: no merece la pena
    let temporizador = null
    let controlador = null      //AbortController de la búsqueda en curso

    //Autocompletado con debounce y cancelación
    watch(nombre, (texto) => {
        clearTimeout(temporizador)
        controlador?.abort()    //la búsqueda anterior ya no sirve: la cancelamos
        texto = texto.trim()
        if (texto.length < MIN_LETRAS) {
            sugerencias.value = []
            return
        }
        temporizador = setTimeout(async () => {
            controlador = new AbortController()
            try {
                //si llega otra tecla, abort() hace que este await lance un AbortError:
                //la respuesta de una búsqueda vieja nunca llega a pintarse
                sugerencias.value = await buscarCatalogo(texto, controlador.signal)
            }
            catch (error) {
                //una búsqueda cancelada no es un error: simplemente ya no nos interesa
                if (error.name !== 'AbortError') console.error(error)
            }
        }, ESPERA_MS)
    })

    //al salir de la página no dejamos temporizadores ni peticiones vivas
    onUnmounted(() => {
        clearTimeout(temporizador)
        controlador?.abort()
    })

    /* Variante con TanStack Query (sesión de server state): la clave incluye el texto,
       así que la librería descarta las respuestas viejas y pasa un signal para cancelar:
         useQuery({
           queryKey: ['catalogo', textoConDebounce],
           queryFn: ({ signal }) => buscarCatalogo(textoConDebounce.value, signal),
           enabled: computed(() => textoConDebounce.value.length >= MIN_LETRAS),
         })
    */

    function anyadir(texto) {
        const limpio = texto.trim()
        if (limpio) {
            emit("nuevo_prod", limpio)
            nombre.value = ""   //el watch cancela lo pendiente y vacía las sugerencias
        }
    }

    function doAnyadir() {
        anyadir(nombre.value)
    }
</script>

<template>
    <form id="form_producto" @submit.prevent="doAnyadir">
        <label for="nuevo_producto">Nuevo producto</label>
        <div class="campos">
            <input
                id="nuevo_producto"
                name="nombre"
                type="text"
                placeholder="Por ejemplo, café"
                autocomplete="off"
                required
                v-model="nombre"
            >
            <button type="submit">Añadir</button>
        </div>
        <ul class="sugerencias" v-if="sugerencias.length > 0">
            <li v-for="s in sugerencias" :key="s.id">
                <button type="button" @click="anyadir(s.nombre)">
                    {{ s.nombre }} <span>{{ s.marca }} · {{ s.formato }}</span>
                </button>
            </li>
        </ul>
    </form>

</template>

<style scoped>
form {
  margin-bottom: 1.5rem;
}

form label {
  display: block;
  margin-bottom: 0.6rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.campos {
  display: flex;
  gap: 0.75rem;
}

.campos input {
  min-width: 0;
  flex: 1;
  padding: 0.9rem 1rem;
  border: 1px solid #cbd8cc;
  border-radius: 10px;
  background: white;
  color: inherit;
  font: inherit;
  font-size: 1.15rem;
}

.campos button {
  padding: 0.9rem 1.4rem;
  border: 0;
  border-radius: 10px;
  background: #367b57;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.campos button:hover {
  background: #286245;
}

.sugerencias {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
  border: 1px solid #dce5dc;
  border-radius: 10px;
  background: white;
  overflow: hidden;
}

.sugerencias li + li {
  border-top: 1px solid #e8eee8;
}

.sugerencias button {
  width: 100%;
  padding: 0.7rem 1rem;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.sugerencias button:hover {
  background: #f4f8f4;
}

.sugerencias span {
  color: #66766a;
  font-size: 0.9rem;
}

</style>
