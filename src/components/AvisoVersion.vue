<script setup>
  //registra el service worker (lo genera vite-plugin-pwa en el build)
  import { useRegisterSW } from 'virtual:pwa-register/vue'

  //needRefresh se pone a true cuando hay una versión nueva "en espera"
  //updateServiceWorker(true) la activa y recarga la página
  const { needRefresh, updateServiceWorker } = useRegisterSW()
</script>

<template>
  <div v-if="needRefresh" class="aviso" role="status">
    Hay una versión nueva de la app.
    <button @click="updateServiceWorker(true)">Recargar</button>
    <button class="secundario" @click="needRefresh = false">Ahora no</button>
  </div>
</template>

<style scoped>
.aviso {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1rem;
  padding: 0.8rem 1rem;
  border-radius: 10px;
  background: #fff6d6;
  border: 1px solid #ecd98c;
}

button {
  padding: 0.4rem 0.9rem;
  border: 0;
  border-radius: 8px;
  background: #367b57;
  color: white;
  font: inherit;
  cursor: pointer;
}

button.secundario {
  background: transparent;
  color: inherit;
  text-decoration: underline;
}
</style>
