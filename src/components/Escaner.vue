<script setup>
    //Escáner de códigos de barras en cuatro pasos, cada uno con su alternativa:
    //  1. imagen:  vídeo con getUserMedia  → si no hay cámara o permiso, foto con capture
    //  2. lectura: BarcodeDetector nativo  → si no existe, polyfill WASM
    //  3. consulta del producto en Open Food Facts → si no está, escribir el nombre
    //  4. al terminar (o al cerrar) se apaga la cámara y se cancela lo pendiente
    import { ref, onMounted, onUnmounted } from 'vue';
    import { obtenerDetector, tipoDetector } from '../servicios/lectorCodigos';
    import { productoPorCodigo, textoProducto } from '../servicios/productosOFF';

    const emit = defineEmits(["producto", "cerrar"])

    //'arrancando' | 'escaneando' | 'sin-camara' | 'buscando' | 'no-encontrado' | 'error'
    const estado = ref("arrancando")
    const mensaje = ref("Abriendo la cámara…")
    const lector = ref("")          //'nativo' o 'polyfill', para enseñarlo en clase
    const video = ref(null)

    let stream = null
    let temporizador = null
    let controlador = null          //AbortController de la consulta a Open Food Facts
    let montado = true

    //El componente se monta al pulsar «Escanear», así que el permiso de cámara
    //se pide en contexto, justo después del gesto del usuario
    onMounted(async () => {
        //empezamos a preparar el lector en paralelo (el polyfill tarda en descargarse)
        const promesaDetector = obtenerDetector()
        promesaDetector.catch(() => {})     //si falla, lo gestionamos más abajo

        if (!navigator.mediaDevices?.getUserMedia)
            return sinCamara("Este navegador no da acceso a la cámara.")
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: "environment", //la cámara trasera si la hay
                    width:  { ideal: 1280 },   //para leer un código no hace falta 4K
                    height: { ideal: 720 },
                    frameRate: { ideal: 15 }   //si solo analizamos 4 fotogramas por segundo, 30 o 60 son demasiados
                },   
                audio: false
            })
        }
        catch (error) {
            return sinCamara(error.name === "NotAllowedError"
                ? "No hay permiso para usar la cámara."
                : "No se ha podido abrir la cámara.")
        }
        if (!montado) return pararCamara()   //se cerró mientras se pedía el permiso

        video.value.srcObject = stream
        await video.value.play()

        let detector
        try {
            detector = await promesaDetector
        }
        catch {
            pararCamara()
            return fallo("No se ha podido cargar el lector de códigos. Escribe el nombre a mano.")
        }
        lector.value = tipoDetector()
        estado.value = "escaneando"
        mensaje.value = "Apunta al código de barras."
        buscarEnVideo(detector)
    })

    //Leemos un fotograma cada 250 ms: más a menudo gasta CPU y batería sin ganar nada
    function buscarEnVideo(detector) {
        temporizador = setTimeout(async () => {
            if (!montado) return
            try {
                const codigos = await detector.detect(video.value)
                if (codigos.length > 0) {
                    pararCamara()       //ya tenemos el código: la cámara sobra
                    return consultar(codigos[0].rawValue)
                }
            }
            catch {
                //el vídeo aún no tiene imagen: lo intentamos en el siguiente
            }
            buscarEnVideo(detector)
        }, 250)
    }

    //Alternativa sin permiso de cámara: el sistema hace la foto y nos da un fichero
    async function leerFoto(evento) {
        const fichero = evento.target.files?.[0]
        evento.target.value = ""        //para poder elegir otra vez la misma foto
        if (!fichero) return
        mensaje.value = "Buscando el código en la foto…"
        try {
            const detector = await obtenerDetector()
            lector.value = tipoDetector()
            const imagen = await createImageBitmap(fichero)
            const codigos = await detector.detect(imagen)
            imagen.close()
            if (codigos.length > 0) return consultar(codigos[0].rawValue)
            mensaje.value = "No se ve ningún código en la foto. Prueba con otra más cerca, o escribe el nombre."
        }
        catch {
            mensaje.value = "No se ha podido leer la foto. Escribe el nombre a mano."
        }
    }

    async function consultar(codigo) {
        estado.value = "buscando"
        mensaje.value = `Código ${codigo}. Buscando el producto…`
        controlador = new AbortController()
        try {
            const producto = await productoPorCodigo(codigo, controlador.signal)
            if (producto) return emit("producto", textoProducto(producto))
            estado.value = "no-encontrado"
            mensaje.value = `El código ${codigo} no está en Open Food Facts. Escribe el nombre a mano.`
        }
        catch (error) {
            if (error.name === "AbortError") return     //se cerró el escáner: nada que hacer
            fallo(error.message || "No se ha podido consultar el producto.")
        }
    }

    function sinCamara(texto) {
        estado.value = "sin-camara"
        mensaje.value = texto + " Puedes hacer una foto del código."
    }

    function fallo(texto) {
        estado.value = "error"
        mensaje.value = texto
    }

    function pararCamara() {
        clearTimeout(temporizador)
        stream?.getTracks().forEach((pista) => pista.stop())   //apaga la cámara (y su luz)
        stream = null
        if (video.value) video.value.srcObject = null
    }

    //cerrar, cancelar o salir de la página: no dejamos nada encendido ni pendiente
    onUnmounted(() => {
        montado = false
        pararCamara()
        controlador?.abort()
    })
</script>

<template>
    <section class="escaner" aria-label="Escanear código de barras">
        <video ref="video" v-show="estado === 'escaneando'" muted playsinline></video>

        <p class="mensaje" role="status">{{ mensaje }}</p>
        <p class="lector" v-if="lector">Lector: {{ lector === 'nativo' ? 'BarcodeDetector nativo' : 'polyfill WebAssembly' }}</p>

        <div class="acciones">
            <label class="boton" v-if="estado === 'sin-camara'">
                Hacer una foto
                <input type="file" accept="image/*" capture="environment" @change="leerFoto">
            </label>
            <button type="button" class="boton secundario" @click="emit('cerrar')">
                {{ estado === 'no-encontrado' || estado === 'error' ? 'Escribir a mano' : 'Cancelar' }}
            </button>
        </div>
    </section>
</template>

<style scoped>
.escaner {
  margin-top: 0.75rem;
  padding: 1rem;
  border: 1px solid #dce5dc;
  border-radius: 10px;
  background: white;
}

video {
  display: block;
  width: 100%;
  max-height: 50vh;
  border-radius: 8px;
  background: #1f2a22;
  object-fit: cover;
}

.mensaje {
  margin: 0.75rem 0 0.25rem;
  font-size: 1.05rem;
}

.lector {
  margin: 0 0 0.75rem;
  color: #66766a;
  font-size: 0.85rem;
}

.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

/* zonas táctiles de al menos 44 px */
.boton {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 1.2rem;
  border: 0;
  border-radius: 10px;
  background: #367b57;
  color: white;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.boton.secundario {
  background: #e8eee8;
  color: inherit;
}

/* el input de fichero queda oculto: se activa al pulsar su label */
.boton input {
  display: none;
}
</style>
