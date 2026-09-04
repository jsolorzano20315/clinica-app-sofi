
import { ref } from 'vue'
import axios from 'axios'

// =====================
// 🌐 ENV / STORAGE
// =====================
const API_URL = import.meta.env.VITE_API_URL

const clinica = JSON.parse(
  localStorage.getItem("clinica") || '""'
)

// =====================
// 📡 ENDPOINT
// =====================
const API_URL_ListaCitas =
  `${API_URL}/Citas/ListaCitas/${encodeURIComponent(clinica)}`

// =====================
// 🧠 INTERFACE
// =====================
export interface Evento {
  id?: number
  motivo: string
  pacienteId: number | null
  nombreCompleto: string
  telefono: string
  fecha: string
  tipo: string
  estado: string
  clinica: any
  doctorId?: number | null
}

// =====================
// 🧩 COMPOSABLE
// =====================
export const useEventos = () => {

  // =====================
  // 📦 STATE
  // =====================
  const eventos = ref<Record<string, Evento[]>>({})

  const selectedDay = ref<string | null>(null)

  const editingIndex = ref<number | null>(null)

  const mostrarConfirmacionEliminar = ref(false)

  const eventoAEliminar = ref<{
    dayKey: string
    index: number
  } | null>(null)

  // =====================
  // 📡 CARGAR EVENTOS
  // =====================
  const cargarEventosBackend = async () => {

    try {

      eventos.value = {}

      const res = await axios.get(API_URL_ListaCitas)

      res.data.forEach((cita: any) => {

        let estado = cita.estado

        if (estado === 'riesgo') {
          estado = 'Pendiente'
        }

        const key = cita.fecha.split('T')[0]

        if (!eventos.value[key]) {
          eventos.value[key] = []
        }

        eventos.value[key].push({
          id: cita.id,
          motivo: cita.motivo,
          pacienteId: cita.pacienteid,
          nombreCompleto: cita.nombreCompleto,
          telefono: cita.telefono,
          fecha: cita.fecha,
          tipo: cita.tipo,
          estado,
          clinica: cita.clinica,
          doctorId: cita.doctorId
        })
      })

    } catch (err) {

      console.error('Error cargando citas', err)

    }
  }

  // =====================
  // ➕ CREAR
  // =====================
  const crearEventoAPI = async (
    evento: Evento,
    fechaKey: string
  ) => {

    const payload = {
      pacienteId: evento.pacienteId,
      nombreCompleto: evento.nombreCompleto,
      fecha: new Date(fechaKey + "T00:00:00").toISOString(),
      motivo: evento.motivo,
      telefono: evento.telefono,
      tipo: evento.tipo,
      estado: evento.estado,
      clinica: clinica,
      doctorId: evento.doctorId ?? null
    }

    return await axios.post(
      `${API_URL}/Citas/GuardarCitas`,
      payload
    )
  }

  // =====================
  // ✏️ EDITAR
  // =====================
  const editarEventoAPI = async (
    evento: Evento,
    fecha: string
  ) => {

    return await axios.put(
      `${API_URL}/Citas/EditarCitas/${evento.id}`,
      {
        fecha,
        motivo: evento.motivo,
        pacienteId: evento.pacienteId,
        telefono: evento.telefono,
        tipo: evento.tipo,
        estado: evento.estado
      }
    )
  }

  // =====================
  // ❌ ELIMINAR
  // =====================
  const eliminarEventoAPI = async (id: number) => {

    await axios.delete(
      `${API_URL}/Citas/EliminarCitas/${id}`
    )
  }

  // =====================
  // 🧩 ABRIR MODAL
  // =====================
  const abrirModal = (
    dayKey: string,
    cita: any,
    index: number | null = null
  ) => {

    selectedDay.value = dayKey

    editingIndex.value = index

    if (
      index !== null &&
      eventos.value[dayKey]
    ) {

      const ev = eventos.value[dayKey][index]

      cita.value.pacienteId = ev.pacienteId
      cita.value.motivo = ev.motivo
      cita.value.nombreCompleto = ev.nombreCompleto
      cita.value.estado = ev.estado
      cita.value.telefono = ev.telefono

    } else {

      cita.value.motivo = ''
      cita.value.nombreCompleto = ''
      cita.value.telefono = ''
    }
  }

  // =====================
  // 💾 GUARDAR
  // =====================
  const guardarEvento = async (
    cita: any,
    doctorId: number | null
  ) => {

    if (
      !selectedDay.value ||
      !cita.value.motivo.trim()
    ) return

    const fechaKey = selectedDay.value

    const nuevo: Evento = {
      fecha: fechaKey,
      pacienteId: cita.value.pacienteId,
      nombreCompleto: cita.value.nombreCompleto,
      motivo: cita.value.motivo,
      telefono: cita.value.telefono,
      tipo: "Consulta General",
      estado: "Pendiente",
      clinica: clinica,
      doctorId
    }

    try {

      // EDITAR
      if (editingIndex.value !== null) {

        const actual =
          eventos.value[fechaKey][editingIndex.value]

        const actualizado: Evento = {
          ...actual,
          ...nuevo
        }

        await editarEventoAPI(actualizado, fechaKey)

        eventos.value[fechaKey][editingIndex.value] =
          actualizado
      }

      // CREAR
      else {

        const creado =
          await crearEventoAPI(nuevo, fechaKey)

        const eventoFinal: Evento = {
          ...nuevo,
          id: creado.data.id
        }

        if (!eventos.value[fechaKey]) {
          eventos.value[fechaKey] = []
        }

        eventos.value[fechaKey].push(eventoFinal)
      }

      // RESET
      selectedDay.value = null

      editingIndex.value = null

      cita.value.motivo = ''
      cita.value.nombreCompleto = ''
      cita.value.telefono = ''

    } catch (err) {

      console.error('Error guardando', err)

    }
  }

  // =====================
  // 🗑 ELIMINAR MODAL
  // =====================
  const eliminarEvento = (
    dayKey: string,
    index: number
  ) => {

    eventoAEliminar.value = {
      dayKey,
      index
    }

    mostrarConfirmacionEliminar.value = true
  }

  // =====================
  // ❌ CANCELAR ELIMINAR
  // =====================
  const cancelarEliminarEvento = () => {

    eventoAEliminar.value = null

    mostrarConfirmacionEliminar.value = false
  }

  // =====================
  // ✅ CONFIRMAR ELIMINAR
  // =====================
  const confirmarEliminarEvento = async () => {

    if (!eventoAEliminar.value) return

    const { dayKey, index } =
      eventoAEliminar.value

    const evento =
      eventos.value[dayKey][index]

    try {

      if (evento.id) {
        await eliminarEventoAPI(evento.id)
      }

      eventos.value[dayKey].splice(index, 1)

      if (
        eventos.value[dayKey].length === 0
      ) {
        delete eventos.value[dayKey]
      }

    } catch (err) {

      console.error('Error eliminando', err)

    } finally {

      cancelarEliminarEvento()
    }
  }

  // =====================
  // 🚀 RETURN
  // =====================
  return {

    // state
    eventos,
    selectedDay,
    editingIndex,

    mostrarConfirmacionEliminar,
    eventoAEliminar,

    // methods
    cargarEventosBackend,
    abrirModal,
    guardarEvento,

    eliminarEvento,
    cancelarEliminarEvento,
    confirmarEliminarEvento
  }
}


