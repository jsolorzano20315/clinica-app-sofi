<script setup lang="ts">
import { ref } from 'vue'
import { Phone } from 'lucide-vue-next'

import { formatearTelefono, telefonoValido } from '@/utils/telefono'
import { generarMensajeWhatsApp } from '@/utils/mensajes'
import { enviarWhatsAppAPI } from '@/services/whatsappService'
import Swal from 'sweetalert2'

const props = defineProps<{
  evento: any
  fecha: string
}>()

const loading = ref(false)

const enviarWhatsApp = async () => {
  try {
    if (!props.evento.telefono) {
      return Swal.fire({
        icon: 'warning',
        title: 'Sin teléfono',
        text: 'Este paciente no tiene teléfono'
      })
    }

    if (!telefonoValido(props.evento.telefono)) {
      return Swal.fire({
        icon: 'error',
        title: 'Teléfono inválido'
      })
    }

    loading.value = true

    const telefono = formatearTelefono(props.evento.telefono)

    const mensaje = generarMensajeWhatsApp(
      props.evento,
      props.fecha
    )

    // ✅ ENVÍO API
    await enviarWhatsAppAPI(
      telefono,
      mensaje
    )

    // ✅ OPCIONAL: abrir WhatsApp Web
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`

    window.open(url, '_blank')

    Swal.fire({
      icon: 'success',
      title: 'WhatsApp enviado'
    })
  } catch (error: any) {
    console.error(error)

    Swal.fire({
      icon: 'error',
      title: 'Error enviando WhatsApp',
      text: error?.response?.data?.message || 'Error inesperado'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button
    @click="enviarWhatsApp"
    :disabled="loading"
    class="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
  >
    <Phone class="w-4 h-4" />

    <span v-if="!loading">
      WhatsApp
    </span>

    <span v-else>
      Enviando...
    </span>
  </button>
</template>