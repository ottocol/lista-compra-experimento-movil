<script setup>
    import { ref, nextTick } from 'vue';
    import Escaner from './Escaner.vue'

    const emit = defineEmits(["nuevo_prod"])
    const nombre = ref("")
    const escaneando = ref(false)
    const campo = ref(null)

    //El nombre encontrado rellena el campo, pero no se añade solo:
    //el usuario puede revisarlo o corregirlo antes de pulsar «Añadir»
    async function alEscanear(texto) {
        nombre.value = texto
        await cerrarEscaner()
    }

    async function cerrarEscaner() {
        escaneando.value = false
        await nextTick()
        campo.value?.focus()
    }

    function doAnyadir() {
        const limpio = nombre.value.trim()
        if (limpio) {
            emit("nuevo_prod", limpio)
            nombre.value = ""
        }
    }
</script>

<template>
    <form id="form_producto" @submit.prevent="doAnyadir">
        <label for="nuevo_producto">Nuevo producto</label>
        <div class="campos">
            <input
                ref="campo"
                id="nuevo_producto"
                name="nombre"
                type="text"
                placeholder="Por ejemplo, café"
                required
                v-model="nombre"
            >
            <button type="submit">Añadir</button>
            <button type="button" class="escanear" v-if="!escaneando" @click="escaneando = true">
                Escanear
            </button>
        </div>
        <Escaner v-if="escaneando" @producto="alEscanear" @cerrar="cerrarEscaner"/>
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

.campos button.escanear {
  background: #e8eee8;
  color: inherit;
}

.campos button.escanear:hover {
  background: #dbe5db;
}


</style>
