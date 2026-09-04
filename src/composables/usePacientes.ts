
import { ref } from 'vue'
import axios from 'axios'

// =====================
// 🌐 STORAGE / ENV
// =====================
const API_URL = import.meta.env.VITE_API_URL

const clinica = JSON.parse(
  localStorage.getItem("clinica") || '""'
)

const API_URL_ListaPacientes =
  `${API_URL}/Pacientes/ListaPacientes/${encodeURIComponent(clinica)}`

// =====================
// 🧠 INTERFACE
// =====================
export interface Pacientes {
  id?: number
  nombreCompleto: string
  fechaNacimiento: string
  telefono: string
  direccion: string
}

// =====================
// 🧩 COMPOSABLE
// =====================
export const usePacientes = () => {

  // =====================
  // 📦 STATE
  // =====================
  const pacientes = ref<Pacientes[]>([])

  const busquedaPaciente = ref('')

  const mostrarLista = ref(false)

  const pacientesFiltrados = ref<Pacientes[]>([])

  // =====================
  // 📡 CARGAR PACIENTES
  // =====================
  const cargarListaPacientes = async () => {

    try {

      const res = await axios.get(API_URL_ListaPacientes)

      pacientes.value = res.data.map((p: any) => ({
        id: p.id,
        nombreCompleto: p.nombreCompleto,
        telefono: p.telefono,
        fechaNacimiento: p.fechaNacimiento,
        direccion: p.direccion
      }))

    } catch (err) {

      console.error('Error cargando pacientes', err)

    }
  }

  // =====================
  // 🔍 FILTRAR
  // =====================
  const filtrarPacientes = () => {

    const texto = busquedaPaciente.value.toLowerCase()

    pacientesFiltrados.value =
      pacientes.value.filter(p =>
        p.nombreCompleto.toLowerCase().includes(texto)
      )
  }

  // =====================
  // ✅ SELECCIONAR
  // =====================
  const seleccionarPaciente = (
    paciente: Pacientes,
    cita: any
  ) => {

    cita.value.pacienteId = paciente.id ?? null

    cita.value.nombreCompleto = paciente.nombreCompleto

    cita.value.telefono = paciente.telefono

    busquedaPaciente.value = paciente.nombreCompleto

    mostrarLista.value = false
  }

  // =====================
  // 🚀 RETURN
  // =====================
  return {

    // state
    pacientes,
    busquedaPaciente,
    mostrarLista,
    pacientesFiltrados,

    // methods
    cargarListaPacientes,
    filtrarPacientes,
    seleccionarPaciente
  }
}


