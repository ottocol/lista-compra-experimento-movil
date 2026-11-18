<script setup>
    import { ref, watch } from 'vue';
    import { buscarCatalogo } from '../servicios/api';

    const emit = defineEmits(["nuevo_prod"])
    const nombre = ref("")
    const sugerencias = ref([])

    //Autocompletado: buscamos en el catálogo cada vez que cambia el texto
    watch(nombre, async (texto) => {
        if (!texto.trim()) {
            sugerencias.value = []
            return
        }
        sugerencias.value = await buscarCatalogo(texto.trim())
    })

    function anyadir(texto) {
        const limpio = texto.trim()
        if (limpio) {
            emit("nuevo_prod", limpio)
            nombre.value = ""
            sugerencias.value = []
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
            <li v-for="s in sugerencias.slice(0, 8)" :key="s.id">
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
