
import { ref } from 'vue'
import axios from 'axios'

// =====================
// 🌐 ENV
// =====================
const API_URL = import.meta.env.VITE_API_URL

// =====================
// 🧩 COMPOSABLE
// =====================
export const useRiesgo = () => {

  // =====================
  // 📦 STATE
  // =====================
  const mostrarAlertaRiesgo = ref(false)

  const citasRiesgo = ref<any[]>([])

  // =====================
  // ⚠️ ESTADO VISUAL
  // =====================
  const calcularEstadoVisual = (evento: any) => {

    const hoy = new Date()

    hoy.setHours(0, 0, 0, 0)

    const fechaCita =
      new Date(evento.fecha)

    fechaCita.setHours(0, 0, 0, 0)

    if (
      evento.estado === 'Pendiente' &&
      fechaCita.getTime() === hoy.getTime()
    ) {
      return 'riesgo'
    }

    return evento.estado
  }

  // =====================
  // 🚨 DETECTAR RIESGO
  // =====================
  const detectarCitasRiesgo = (
    eventos: any
  ) => {

    const lista: any[] = []

    for (const fechaKey in eventos.value) {

      for (const evento of eventos.value[fechaKey]) {

        if (
          calcularEstadoVisual(evento) === 'riesgo'
        ) {
          lista.push(evento)
        }
      }
    }

    citasRiesgo.value = lista

    mostrarAlertaRiesgo.value =
      lista.length > 0

    if (lista.length > 0) {

      const audio = new Audio('/alert.mp3')

      audio.play()
    }
  }

  // =====================
  // 🔄 ACTUALIZAR VENCIDAS
  // =====================
  const actualizarCitasVencidas = async (
    eventos: any
  ) => {

    const hoy = new Date()

    const hoyKey =
      hoy.getFullYear() + '-' +
      String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
      String(hoy.getDate()).padStart(2, '0')

    for (const fechaKey in eventos.value) {

      for (const evento of eventos.value[fechaKey]) {

        if (evento.estado !== 'Pendiente') {
          continue
        }

        const fechaCita =
          new Date(fechaKey + "T00:00:00")

        const hoyDate =
          new Date(hoyKey + "T00:00:00")

        const diffDias = Math.floor(
          (hoyDate.getTime() - fechaCita.getTime()) /
          (1000 * 60 * 60 * 24)
        )

        // EXACTAMENTE 1 DÍA
        if (diffDias === 1) {

          try {

            const payload = {
              id: evento.id,
              fecha: evento.fecha,
              motivo: evento.motivo,
              pacienteId: evento.pacienteId,
              nombreCompleto: evento.nombreCompleto,
              telefono: evento.telefono,
              tipo: evento.tipo,
              estado: 'Cancelada',
              clinica: evento.clinica,
              doctorId: evento.doctorId ?? null
            }

            await axios.put(
              `${API_URL}/Citas/EditarCitas/${evento.id}`,
              payload
            )

            evento.estado = 'Cancelada'

            console.log(
              `✅ Cita ${evento.id} cancelada`
            )

          } catch (error: any) {

            console.error(
              `❌ Error actualizando cita ${evento.id}`,
              error.response?.data || error
            )
          }
        }
      }
    }
  }

  // =====================
  // 🚀 RETURN
  // =====================
  return {

    // state
    mostrarAlertaRiesgo,
    citasRiesgo,

    // methods
    calcularEstadoVisual,
    detectarCitasRiesgo,
    actualizarCitasVencidas
  }
}

