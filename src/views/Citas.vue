<script setup lang="ts">
/* =========================================================
   📦 IMPORTS
   Componentes de UI, layout, Vue reactivity y Axios
========================================================= */
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, onMounted, nextTick } from 'vue'

import axios from 'axios'

/* =========================================================
   ⚙️ CONFIGURACIÓN GENERAL
   Usuario logueado + endpoints de la API
========================================================= */
const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''
const rol = localStorage.getItem("rol") || ''


const API_URL = import.meta.env.VITE_API_URL

const API_URL_ListaPacientes = `${API_URL}/Pacientes/ListaPacientes/${encodeURIComponent(clinica)}`

const API_URL_ListaDoctores = `${API_URL}/Doctores/ListaDoctores/${encodeURIComponent(email)}`

const API_URL_Citas_Lista = `${API_URL}/Citas/ListaCitas/${encodeURIComponent(clinica)}`

const API_URL_Citas_Guardar = `${API_URL}/Citas/GuardarCitas`

const API_URL_Citas_Modificar = `${API_URL}/Citas/EditarCitas`

/* =========================================================
   🏷️ TÍTULO DE PÁGINA
========================================================= */
const pageTitle = ref('Citas Médicas')

/* =========================================================
   🧾 TIPOS (MODELOS DE DATOS)
   Estructuras de Paciente, Doctor y Cita
========================================================= */
interface Paciente {
  id: number
  nombreCompleto: string
  telefono?: string
}

interface Doctor {
  id: number
  nombreDoctor: string
  telefono?: string
  email: string
}

interface FormData {
  id: number
  pacienteId: number
  doctorId: number
  fecha: string
  hora: string
  tipo: string
  telefono: string
  motivo: string
  estado: string
  nombreCompleto: string
  nombreDoctor: string
  clinica: string
}

// =========================================================
// 🚨 MENSAJES (MODAL PERSONALIZADO)
// =========================================================
const mensaje = ref('')
const tipoMensaje = ref<'success' | 'error' | 'warning'>('success')
const mostrarMensaje = ref(false)
const mostrarConfirmarEdicion = ref(false)
const citaAEditar = ref<any>(null)


const configTipo = computed(() => {
  switch (tipoMensaje.value) {
    case 'success':
      return {
        title: 'Success!',
        color: 'green',
        icon: `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
            d="M5 13l4 4L19 7" />
        `
      }

    case 'error':
      return {
        title: 'Error!',
        color: 'red',
        icon: `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
            d="M6 18L18 6M6 6l12 12" />
        `
      }

    case 'warning':
      return {
        title: 'Warning!',
        color: 'yellow',
        icon: `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
            d="M12 9v4m0 4h.01M12 3l9 18H3l9-18z" />
        `
      }

    default:
      return {
        title: 'Info',
        color: 'blue',
        icon: `
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
            d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
        `
      }
  }
})

const mostrarConfirmacion = ref(false)
const citaAEliminar = ref<number | null>(null)

const abrirConfirmacionEliminar = (id: number) => {
  citaAEliminar.value = id
  mostrarConfirmacion.value = true
}

const cancelarEliminar = () => {
  citaAEliminar.value = null
  mostrarConfirmacion.value = false
}

const confirmarEliminar = async () => {
  if (!citaAEliminar.value) return

  try {
    await axios.delete(`${API_URL}/Citas/EliminarCitas/${citaAEliminar.value}`)

    await cargarCitas()

    //mostrarAlerta("Cita eliminada correctamente", "success")

     resetForm() // 🔥 LIMPIAR FORMULARIO AQUÍ

  } catch (error) {
    console.error("Error eliminando cita:", error)
    mostrarAlerta("Error al eliminar cita", "error")
  } finally {
    cancelarEliminar()
  }
}

const mostrarAlerta = (texto: string, tipo: 'success' | 'error' | 'warning' = 'success') => {
  mensaje.value = texto
  tipoMensaje.value = tipo

  mostrarMensaje.value = false

  setTimeout(() => {
    mostrarMensaje.value = true
  }, 50)
}


// =========================================================
// 📅 FECHA MÍNIMA = FECHA/HORA ACTUAL
// =========================================================
const fechaMinima = ref('')

const actualizarFechaMinima = () => {

  const ahora = new Date()

  // 🔥 agregar 5 minutos
  ahora.setMinutes(ahora.getMinutes() + 5)

  const year = ahora.getFullYear()
  const month = String(ahora.getMonth() + 1).padStart(2, '0')
  const day = String(ahora.getDate()).padStart(2, '0')

  const hours = String(ahora.getHours()).padStart(2, '0')
  const minutes = String(ahora.getMinutes()).padStart(2, '0')

  fechaMinima.value =
    `${year}-${month}-${day}T${hours}:${minutes}`
}

/* =========================================================
   🔄 ESTADOS REACTIVOS
   Datos principales + UI (paginación, filtros, vista)
========================================================= */
const pacientes = ref<Paciente[]>([])
const doctores = ref<Doctor[]>([])
const citas = ref<FormData[]>([])

const modoEdicion = ref(false)

const selectedDoctorId = ref<number | null>(null)
const searchPaciente = ref('')
const selectedPaciente = ref<number | null>(null)

const currentPage = ref(1)
const itemsPerPage = 12

const currentPageCitas = ref(1)
const itemsPerPageCitas = 5

const view = ref<'pacientes' | 'form' | 'citas'>('pacientes') 

const estados = ref(['Pendiente', 'Confirmada', 'Cancelada', 'ReprogramacionPendiente'])

const tipos = ref(['Consulta General', 'Emergencia'])

/* =========================================================
   📝 FORMULARIO REACTIVO
   Datos para crear una cita médica
========================================================= */
const formData = ref<FormData>({
  id: 0,
  pacienteId: 0,
  doctorId: 0,
  fecha: '',
  hora: '',
  tipo: '',
  telefono: '',
  motivo: '',
  estado: '',
  nombreCompleto: '',
  nombreDoctor: '',
  clinica: ''
})

/* =========================================================
   🌐 API - CARGA DE DATOS
   Obtener pacientes, doctores y citas desde backend
========================================================= */
const cargarPacientes = async () => {
  try {
    const res = await axios.get(API_URL_ListaPacientes)
    const data = res.data

    pacientes.value = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.pacientes)
      ? data.pacientes
      : []
  } catch (err) {
    console.error(err)
    pacientes.value = []
  }
}

const cargarDoctores = async () => {
  try {
    const res = await axios.get(API_URL_ListaDoctores)
    const data = res.data

    doctores.value = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.doctores)
      ? data.doctores
      : []
  } catch (err) {
    console.error(err)
    doctores.value = []
  }
}

const cargarCitas = async () => {
  try {
    const res = await axios.get(API_URL_Citas_Lista)

    const data =
      Array.isArray(res.data) ? res.data :
      Array.isArray(res.data.data) ? res.data.data :
      Array.isArray(res.data.citas) ? res.data.citas :
      []

    citas.value = data
  } catch (error) {
    console.error("Error cargando citas:", error)
    citas.value = []
  }
}

/* =========================================================
   📊 COMPUTED (DATOS DERIVADOS)
   Filtros, paginación y transformaciones de datos
========================================================= */
const pacientesCRUD = computed(() => pacientes.value)

const filteredPacientes = computed(() =>
  pacientesCRUD.value.filter(p =>
    p.nombreCompleto?.toLowerCase().includes(searchPaciente.value.toLowerCase())
  )
)

const paginatedPacientes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPacientes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(filteredPacientes.value.length / itemsPerPage) || 1
)

const paginatedCitas = computed(() => {
  const start = (currentPageCitas.value - 1) * itemsPerPageCitas
  return citas.value.slice(start, start + itemsPerPageCitas)
})

const totalPagesCitas = computed(() =>
  Math.ceil(citas.value.length / itemsPerPageCitas) || 1
)

// Convierte fecha ISO a formato DD/MM/YYYY
const formatearFecha = (fecha: string) => {
  if (!fecha) return ''

  const soloFecha = fecha.split('T')[0]

  const [anio, mes, dia] = soloFecha.split('-')

  return `${dia}/${mes}/${anio}`
}

const formatearHora = (hora: string) => {
  if (!hora) return ''

  return hora.substring(0, 5) // 16:32
}

/* =========================================================
   🧩 FUNCIONES PRINCIPALES
   Selección de paciente, envío de formulario y control UI
========================================================= */
// Selecciona paciente y pasa a vista de citas
const seleccionarPaciente = (id: number) => {
  selectedPaciente.value = id
  formData.value.pacienteId = id

  const paciente = pacientes.value.find(p => p.id === id)
  if (paciente?.telefono) {
    formData.value.telefono = paciente.telefono
  }
  resetForm()
  view.value = 'citas'
}

// Envía formulario de cita al backend
const enviarFormulario = async () => {
  try {
    if (!formData.value.fecha) {
      mostrarAlerta("Debe ingresar la fecha", "warning")
      return
    }

    // ⚠️ NO usar new Date() aquí porque cambia la hora (UTC)
    const [fecha, hora] = formData.value.fecha.split('T')

    const payload = {
      id: formData.value.id,
      pacienteId: Number(formData.value.pacienteId),
      doctorId: Number(selectedDoctorId.value),

      fecha: fecha,
      hora: hora.substring(0, 5),

      motivo: formData.value.motivo,
      tipo: formData.value.tipo,
      telefono: formData.value.telefono,
      estado: formData.value.estado,
      clinica: clinica
    }

    // 🔥 AQUÍ está la clave: decidir si es crear o editar
    if (modoEdicion.value && formData.value.id > 0) {
      await axios.put(`${API_URL}/Citas/EditarCitas`, payload)
      mostrarAlerta("Cita actualizada correctamente", "success")
    } else {
      await axios.post(API_URL_Citas_Guardar, payload)
      mostrarAlerta("Cita creada correctamente", "success")
    }

    await cargarCitas()
    resetForm()
    view.value = "citas"

  } catch (error) {
    console.error(error)
    mostrarAlerta("Ocurrió un error al guardar", "error")
  }
}

const confirmarEdicion = () => {
  const cita = citaAEditar.value

  formData.value = {
    id: cita.id,
    pacienteId: cita.pacienteId,
    fecha: cita.fecha?.slice(0, 16),
    hora: cita.hora,
    motivo: cita.motivo,
    tipo: cita.tipo,
    telefono: cita.telefono,
    estado: cita.estado,
    doctorId: cita.doctorId,
    nombreCompleto: cita.nombreCompleto ?? '',
    nombreDoctor: cita.nombreDoctor ?? '',
    clinica: clinica
  }

  modoEdicion.value = true
  view.value = 'citas'

  mostrarConfirmarEdicion.value = false
}

const cancelarEdicion = () => {
  citaAEditar.value = null
  mostrarConfirmarEdicion.value = false
}

//Editar
const editarCita = (cita: any) => {
  formData.value = {
    id: cita.id,
    pacienteId: cita.pacienteId, // 👈 aquí va el dato correcto
    fecha: cita.fecha,
    hora: cita.hora,
    motivo: cita.motivo,
    tipo: cita.tipo,
    telefono: cita.telefono,
    estado: cita.estado,
    doctorId: cita.doctorId,
    nombreCompleto: cita.nombreCompleto ?? '',
    nombreDoctor: cita.nombreDoctor ?? '',
    clinica: clinica
  }

  // 🔥 ACTIVAR MODO EDICIÓN
  modoEdicion.value = true

  // 🔥 CAMBIAR VISTA SI ES NECESARIO
  view.value = 'citas'

  // (opcional UX)
 // mostrarAlerta("Editando cita", "warning")
}

//Eliminar
const eliminarCita = (id: number) => {
  abrirConfirmacionEliminar(id)
}


// Reinicia formulario
const resetForm = () => {
  formData.value = {
    id: 0,
    pacienteId: selectedPaciente.value || 0, // 🔥 mantener paciente
    doctorId: selectedDoctorId.value || 0,
    fecha: '',
    hora: '',
    tipo: '',
    telefono: '',
    motivo: '',
    estado: '',
    nombreCompleto: '',
    nombreDoctor: '',
    clinica: clinica
  }

  modoEdicion.value = false // 🔥 IMPORTANTE
}


/* =========================================================
   🚀 CICLO DE VIDA
   Carga inicial de datos al montar componente
========================================================= */
onMounted(async () => {

  actualizarFechaMinima()

  setInterval(() => {
    actualizarFechaMinima()
  }, 60000)

  await cargarPacientes()

  cargarDoctores().then(() => {
    const doc = doctores.value.find(d => d.email === email)
    if (doc) selectedDoctorId.value = doc.id
  })

  await cargarCitas()
})

</script>

<!-- =========================================================
     🎨 TEMPLATE (UI)
     Vista de pacientes, formulario de citas y tabla
========================================================= -->
<template>
  <DefaultLayout>
    <BreadcrumbDefault :pageTitle="pageTitle" />


<!-- ===================== -->
<!-- MODAL MENSAJES -->
<!-- ===================== -->
<div v-if="mostrarMensaje" class="fixed inset-0 z-[9999] flex items-center justify-center">

  <!-- Fondo -->
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  <!-- Modal -->
  <div class="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center w-[320px] relative">

    <!-- Icono -->
    <div class="flex justify-center mb-4">
      <div
        :class="[
          'w-20 h-20 rounded-full border-4 flex items-center justify-center',
          `border-${configTipo.color}-200`
        ]"
      >
        <svg
          class="w-10 h-10"
          :class="`text-${configTipo.color}-500`"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          v-html="configTipo.icon"
        />
      </div>
    </div>

    <!-- Título -->
    <h2 class="text-2xl font-semibold text-gray-800 mb-2">
      {{ configTipo.title }}
    </h2>

    <!-- Mensaje -->
    <p class="text-gray-500 mb-6">
      {{ mensaje }}
    </p>

    <!-- Botón -->
    <button
      @click="mostrarMensaje = false"
      class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
    >
      OK
    </button>

  </div>
</div>

<!-- ===================== -->
<!-- MODAL CONFIRMAR ELIMINAR -->
<!-- ===================== -->
<div v-if="mostrarConfirmacion" class="fixed inset-0 z-[10000] flex items-center justify-center">

  <!-- Fondo -->
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  <!-- Caja -->
  <div class="bg-white rounded-2xl shadow-2xl p-6 w-[320px] text-center relative">

    <h2 class="text-xl font-bold text-gray-800 mb-2">
      ¿Eliminar cita?
    </h2>

    <p class="text-gray-500 mb-6">
      Esta acción no se puede deshacer.
    </p>

    <div class="flex justify-center gap-4">

      <!-- NO -->
      <button
        @click="cancelarEliminar"
        class="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
      >
        No
      </button>

      <!-- SI -->
      <button
        @click="confirmarEliminar"
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        Sí, eliminar
      </button>

    </div>

  </div>
</div>

<!-- ===================== -->
<!-- MODAL MECONFIRMAR Editar -->
<!-- ===================== -->
<div v-if="mostrarConfirmarEdicion" class="fixed inset-0 z-[10000] flex items-center justify-center">

  <div class="absolute inset-0 bg-black/50"></div>

  <div class="bg-white p-6 rounded-xl text-center w-[320px] relative">

    <h2 class="text-lg font-bold mb-2">¿Editar cita?</h2>
    <p class="text-gray-500 mb-4">Se cargará la información para modificarla</p>

    <div class="flex justify-center gap-3">

      <button @click="cancelarEdicion"
        class="px-4 py-2 bg-gray-300 rounded">
        No
      </button>

      <button @click="confirmarEdicion"
        class="px-4 py-2 bg-blue-600 text-white rounded">
        Sí, editar
      </button>

    </div>

  </div>
</div>


    <div class="flex justify-center">
      <div class="w-full max-w-7xl">

        <!-- ===================== -->
        <!-- LISTA PACIENTES -->
        <!-- ===================== -->
        <div v-if="view === 'pacientes'">

          <input
            v-model="searchPaciente"
            type="text"
            placeholder="Buscar paciente..."
            class="w-full mb-4 p-2 border rounded"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <div
              v-for="paciente in paginatedPacientes"
              :key="paciente.id"
              class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col"
            >
              <div class="text-lg font-bold mb-2 text-center">
                {{ paciente.nombreCompleto }}
              </div>

              <button
                @click="seleccionarPaciente(paciente.id)"
                class="flex-1 bg-primary text-white py-1 rounded mt-auto"
              >
                Seleccionar
              </button>
            </div>

          </div>

          <!-- PAGINACIÓN PACIENTES -->
          <div class="flex justify-center mt-6 gap-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              class="px-3 py-1 bg-gray-300 rounded"
            >
              Anterior
            </button>

            <span>
              Página {{ currentPage }} de {{ totalPages }}
            </span>

            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 bg-gray-300 rounded"
            >
              Siguiente
            </button>
          </div>

        </div>

        <!-- ===================== -->
        <!-- FORMULARIO CITA -->
        <!-- ===================== -->
        <DefaultCard v-if="view === 'citas'" cardTitle="Registro de citas">

          <form @submit.prevent="enviarFormulario">

            <div class="p-6.5 flex flex-col gap-6">

              <!-- Paciente + Doctor -->
              <div class="flex flex-col gap-6 xl:flex-row">

                <div class="w-full xl:w-1/2">
                  <label class="block mb-2.5">Paciente</label>
                  <input
                    type="text"
                    :value="pacientesCRUD.find(p => p.id === formData.pacienteId)?.nombreCompleto"
                    disabled
                    class="w-full rounded border py-3 px-5 bg-gray-100"
                  />
                </div>

                  <!-- Fecha -->
              <div class="w-full xl:w-1/2">
                <label class="block mb-2.5">
                  Fecha y Hora
                </label>

                <input
                  type="datetime-local"
                  v-model="formData.fecha"
                  :min="fechaMinima"
                  class="w-full border py-3 px-5 rounded"
                  :required="!modoEdicion"
                />
              </div>

              </div>

              <!--  Estado + Tipo -->
              <div class="flex flex-col gap-6 xl:flex-row">

                <div class="w-full xl:w-1/2">
                  <label class="block mb-2.5">Estado</label>
                  <select
                    v-model="formData.estado"
                    class="w-full border py-3 px-5"
                    required
                  >
                    <option value="" disabled>--Seleccionar Estado--</option>
                    <option v-for="estado in estados" :key="estado" :value="estado">
                      {{ estado }}
                    </option>
                  </select>
                </div>

                <div class="w-full xl:w-1/2">
                  <label class="block mb-2.5">Tipo</label>
                 <select
                    v-model="formData.tipo"
                    class="w-full border py-3 px-5"
                    required
                  >
                    <option value="" disabled>--Seleccionar Tipo--</option>
                    <option v-for="tipo in tipos" :key="tipo" :value="tipo">
                      {{ tipo }}
                    </option>
                  </select>
                </div>

              </div>

              <!-- Motivo -->
              <div>
                <label class="block mb-2.5">Motivo</label>
                <input
                  type="text"
                  v-model="formData.motivo"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

              <!-- BOTONES -->
              <div class="flex gap-4">

                <button
                    type="submit"
                    :class="modoEdicion ? 'bg-yellow-600' : 'bg-green-600'"
                    class="px-4 py-2 text-white rounded"
                  >
                    {{ modoEdicion ? 'Modificar Datos' : 'Guardar Datos' }}
                  </button>

                <button
                  type="button"
                  @click="view = 'pacientes'"
                  class="bg-gray-300 px-4 py-2 rounded"
                >
                  Regresar
                </button>

              </div>

            </div>

          </form>

        </DefaultCard>

        <!-- ===================== -->
        <!-- TABLA CITAS -->
        <!-- ===================== -->
        <DefaultCard v-if="view === 'citas'" cardTitle="Lista de Citas">

          <div class="overflow-x-auto">

           <!-- TABLA PROFESIONAL CITAS (FECHA + HORA) -->
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div class="overflow-x-auto">

                <table class="min-w-full divide-y divide-gray-200">

                  <!-- HEADER -->
                  <thead class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">

                    <tr>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Fecha y hora
                      </th>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Paciente
                      </th>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Teléfono
                      </th>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Motivo
                      </th>

                       <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Tipo
                      </th>

                      <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>

                  </thead>

                  <!-- BODY -->
                  <tbody class="divide-y divide-gray-100 bg-white">

                    <tr
                      v-for="cita in paginatedCitas"
                      :key="cita.id"
                      class="hover:bg-slate-50 transition"
                    >

                      <!-- FECHA + HORA -->
                      <td class="px-6 py-4 whitespace-nowrap">

                        <div class="flex flex-col">

                          <span class="text-sm font-semibold text-gray-800">
                            {{ formatearFecha(cita.fecha) }} : 🕒 {{ formatearHora(cita.hora) }}
                          </span>
                        </div>
                      </td>

                      <!-- PACIENTE -->
                      <td class="px-6 py-4">

                        <div class="flex items-center gap-3">

                          <div class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold">
                            {{ pacientes.find(p => p.id === cita.pacienteId)?.nombreCompleto?.charAt(0) }}
                          </div>

                          <div>

                            <p class="font-semibold text-gray-800">
                              {{ pacientes.find(p => p.id === cita.pacienteId)?.nombreCompleto }}
                            </p>

                            <p class="text-xs text-gray-400">
                              Paciente
                            </p>

                          </div>

                        </div>

                      </td>

                      <!-- TELÉFONO -->
                      <td class="px-6 py-4 whitespace-nowrap">
                        📞 {{ pacientes.find(p => p.id === cita.pacienteId)?.telefono }}
                      </td>
                      <!-- MOTIVO -->
                      <td class="px-6 py-4 max-w-[220px]">

                        <p class="text-sm text-gray-700 truncate">
                          {{ cita.motivo }}
                        </p>

                      </td>

                      <!-- TIPO -->
                      <td class="px-6 py-4">

                        <span class="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {{ cita.tipo }}
                        </span>

                      </td>

                       <!-- ESTADO -->
                      <td class="px-6 py-4 text-center">

                        <span
                          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                          :class="{
                            'bg-yellow-100 text-yellow-700': cita.estado === 'Pendiente',
                            'bg-green-100 text-green-700': cita.estado === 'Confirmada',
                            'bg-orange-100 text-orange-700': cita.estado === 'ReprogramacionPendiente',
                            'bg-red-100 text-red-700': cita.estado === 'Cancelada'
                          }"
                        >
                          {{ cita.estado }}
                        </span>

                      </td>

                    </tr>

                    <!-- EMPTY -->
                    <tr v-if="paginatedCitas.length === 0">

                      <td colspan="7" class="px-6 py-12 text-center text-gray-500">

                        <div class="flex flex-col items-center gap-2">
                          <span class="text-4xl">📅</span>
                          <p class="font-medium">No hay citas registradas</p>
                        </div>

                      </td>

                    </tr>

                  </tbody>

                </table>

              </div>

            </div>

          </div>

         <!-- PAGINACIÓN PACIENTES -->
          <div class="flex justify-center mt-6 gap-2">
            <button
              @click="currentPageCitas--"
              :disabled="currentPageCitas === 1"
              class="px-3 py-1 bg-gray-300 rounded"
            >
              Anterior
            </button>

            <span>
              Página {{ currentPageCitas }} de {{ totalPagesCitas }}
            </span>

            <button
              @click="currentPageCitas++"
              :disabled="currentPageCitas === totalPagesCitas"
              class="px-3 py-1 bg-gray-300 rounded"
            >
              Siguiente
            </button>
          </div>
                   <br>
    
        </DefaultCard>

      </div>
    </div>

  </DefaultLayout>
</template>
