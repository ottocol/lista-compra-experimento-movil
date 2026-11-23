<script setup>
 import { ref, onMounted, onUnmounted } from 'vue'
 import { RouterView } from 'vue-router'
 import AvisoVersion from './components/AvisoVersion.vue'

 //¿hay red? Sin ella la lista que se ve es la última guardada en la caché
 const sinRed = ref(!navigator.onLine)
 const actualizar = () => { sinRed.value = !navigator.onLine }
 onMounted(() => {
   window.addEventListener('online', actualizar)
   window.addEventListener('offline', actualizar)
 })
 onUnmounted(() => {
   window.removeEventListener('online', actualizar)
   window.removeEventListener('offline', actualizar)
 })
</script>

<template>
  <main>
  <h1>Lista de la compra</h1>
  <AvisoVersion/>
  <p v-if="sinRed" class="sin-red">Sin conexión: estás viendo la última lista guardada.</p>
  <!-- Aquí se pinta el componente de la ruta actual (Login o ListaCompra) -->
  <RouterView/>
  </main>
</template>

<style scoped>
.sin-red {
  margin: 0 0 1rem;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  background: #eef1ee;
  color: #4a5a4e;
}
</style>
