<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, onMounted } from 'vue'
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

const API_URL_Pacientes_Guardar = `${API_URL}/Pacientes/GuardarPacientes`

const modoEdicion = ref(false)
/* =========================================================
   🏷️ TÍTULO DE PÁGINA
========================================================= */
const pageTitle = ref('Pacientes')


// ✅ INTERFACE CORRECTA
interface Paciente {
  id: number
  nombreCompleto: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  fecha: string
  telefono: string
  direccion: string
}

// ✅ ESTADOS PRIMERO
const pacientes = ref<Paciente[]>([])
const currentPage = ref(1)
const itemsPerPage = 5

// =========================================================
// 🚨 MENSAJES (MODAL PERSONALIZADO)
// =========================================================
const mensaje = ref('')
const tipoMensaje = ref<'success' | 'error' | 'warning'>('success')
const mostrarMensaje = ref(false)

// CONFIG VISUAL
const configTipo = computed(() => {
  switch (tipoMensaje.value) {
    case 'success':
      return {
        title: 'Success!',
        color: 'green',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
          d="M5 13l4 4L19 7" />`
      }

    case 'error':
      return {
        title: 'Error!',
        color: 'red',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
          d="M6 18L18 6M6 6l12 12" />`
      }

    case 'warning':
      return {
        title: 'Warning!',
        color: 'yellow',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
          d="M12 9v4m0 4h.01M12 3l9 18H3l9-18z" />`
      }

    default:
      return {
        title: 'Info',
        color: 'blue',
        icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
          d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />`
      }
  }
})

// FUNCIÓN ALERTA
const mostrarAlerta = (texto: string, tipo: 'success' | 'error' | 'warning' = 'success') => {
  mensaje.value = texto
  tipoMensaje.value = tipo

  mostrarMensaje.value = false

  setTimeout(() => {
    mostrarMensaje.value = true
  }, 50)
}

// MODAL DE CONFIRMACIÓN ELIMINAR
const mostrarConfirmacion = ref(false)
const pacienteAEliminar = ref<number | null>(null)

const abrirConfirmacionEliminar = (id: number) => {
  pacienteAEliminar.value = id
  mostrarConfirmacion.value = true
}

const cancelarEliminar = () => {
  pacienteAEliminar.value = null
  mostrarConfirmacion.value = false
}

const confirmarEliminar = async () => {
  if (!pacienteAEliminar.value) return

  try {
    await axios.delete(`${API_URL}/Pacientes/EliminarPacientes/${pacienteAEliminar.value}`)
    await cargarPacientes()

    //mostrarAlerta("Paciente eliminado correctamente", "success")

  } catch (error) {
    console.error(error)
    mostrarAlerta("Error al eliminar paciente", "error")
  } finally {
    cancelarEliminar()
  }
}

/* =========================================================
   📝 FORMULARIO REACTIVO
   Datos para crear una cita médica
========================================================= */
// ✅ FORM CORRECTO
const formData = ref({
  Id: 0,
  Nombre: '',
  Apellido: '',
  FechaNacimiento: '',
  Telefono: '',
  Direccion: ''
})

/* =========================================================
   🌐 API - CARGA DE DATOS
   Obtener pacientes, doctores y citas desde backend
========================================================= */
// ✅ CARGA DE DATOS (CORRECTA)
const cargarPacientes = async () => {
  try {
    const res = await axios.get(API_URL_ListaPacientes)

    const data = res.data

    pacientes.value = data.map((p: any) => {
      const partes = p.nombreCompleto.split(' ')

      return {
        id: p.id,
        nombreCompleto: p.nombreCompleto,
        fechaNacimiento: p.fechaNacimiento,
        fecha: p.fecha,
        telefono: p.telefono,
        direccion: p.direccion
      }
    })

  } catch (err) {
    console.error(err)
    pacientes.value = []
  }
}

/* =========================================================
   🔄 ESTADOS REACTIVOS
   Datos principales + UI (paginación, filtros, vista)
========================================================= */

// ✅ COMPUTED
const paginated = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return pacientes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(pacientes.value.length / itemsPerPage) || 1
)


//const view = ref<'pacientes' | 'form' | 'formulario'>('pacientes') 
const view = ref('formulario')


// Reset formulario
const resetForm = () => {
  formData.value = { Id: 0, Nombre: '', Apellido: '', FechaNacimiento: '', Telefono: '', Direccion: '' }
}

/* =========================================================
   📊 COMPUTED (DATOS DERIVADOS)
   Filtros, paginación y transformaciones de datos
========================================================= */
// ✅ FORMATO FECHA
const formatearFecha = (fecha: string) => {
  if (!fecha) return ''
  const f = new Date(fecha)
  return `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}/${f.getFullYear()}`
}

const telefonoFormateado = computed({
  get: () => formData.value.Telefono,
  set: (val: string) => {
    formData.value.Telefono = val.replace(/[^0-9]/g, '')
  }
})

/* =========================================================
   🧩 FUNCIONES PRINCIPALES
   Selección de paciente, envío de formulario y control UI
========================================================= */
// ✅ GUARDAR
const enviarFormulario = async () => {
  try {
    formData.value.Clinica = clinica

    if (modoEdicion.value) {
      await axios.put(
        `${API_URL}/Pacientes/EditarPacientes/${formData.value.Id}`,
        formData.value
      )

       mostrarAlerta("Paciente actualizado correctamente", "success")
    } else {
      await axios.post(API_URL_Pacientes_Guardar, formData.value)

      mostrarAlerta("Paciente creado correctamente", "success")
    }


    resetForm()
    modoEdicion.value = false
    await cargarPacientes()

   } catch (error) {
    console.error(error)
    mostrarAlerta("Error al guardar paciente", "error")
  }
}

// ✅ EDITAR
const editarCita = (paciente: any) => {
  const partes = paciente.nombreCompleto.split(' ')

  formData.value = {
    Id: paciente.id,
    Nombre: partes[0] || '',
    Apellido: partes.slice(1).join(' ') || '',
    FechaNacimiento: paciente.fechaNacimiento?.split('T')[0],
    Telefono: paciente.telefono,
    Direccion: paciente.direccion
  }

  modoEdicion.value = true
}

// ✅ ELIMINAR
const eliminarCita = (id: number) => {
  abrirConfirmacionEliminar(id)
}

// ✅ MOUNT
onMounted(() => {
  cargarPacientes()
})

</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault :pageTitle="pageTitle" />

    <!-- ===================== -->
    <!-- MODAL MENSAJES -->
    <!-- ===================== -->
<div v-if="mostrarMensaje" class="fixed inset-0 z-[9999] flex items-center justify-center">

  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  <div class="bg-white rounded-2xl shadow-2xl px-10 py-8 text-center w-[320px] relative">

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

    <h2 class="text-2xl font-semibold text-gray-800 mb-2">
      {{ configTipo.title }}
    </h2>

    <p class="text-gray-500 mb-6">
      {{ mensaje }}
    </p>

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

  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

  <div class="bg-white rounded-2xl shadow-2xl p-6 w-[320px] text-center relative">

    <h2 class="text-xl font-bold text-gray-800 mb-2">
      ¿Eliminar paciente?
    </h2>

    <p class="text-gray-500 mb-6">
      Esta acción no se puede deshacer.
    </p>

    <div class="flex justify-center gap-4">

      <button
        @click="cancelarEliminar"
        class="px-4 py-2 bg-gray-300 rounded-lg"
      >
        No
      </button>

      <button
        @click="confirmarEliminar"
        class="px-4 py-2 bg-red-600 text-white rounded-lg"
      >
        Sí, eliminar
      </button>

    </div>

  </div>
</div>

    <div class="flex justify-center">
      <div class="w-full max-w-7xl">

        <!-- ===================== -->
        <!-- FORMULARIO -->
        <!-- ===================== -->
        <DefaultCard cardTitle="Ingrese Datos del Paciente">
          <form @submit.prevent="enviarFormulario">
            <div class="p-6.5 space-y-6">

              <!-- Nombre -->
              <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">
                <div class="flex flex-col w-full xl:w-1/2 gap-2">
                  <label>Nombre</label>
                  <input
                    type="text"
                    v-model="formData.Nombre"
                    class="w-full border py-3 px-5 rounded"
                    required
                  />
                </div>

                <div class="flex flex-col w-full xl:w-1/2 gap-2">
                  <label>Apellido</label>
                  <input
                    type="text"
                    v-model="formData.Apellido"
                    class="w-full border py-3 px-5 rounded"
                    required
                  />
                </div>
              </div>

              <!-- Fecha y Teléfono -->
              <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">
                <div class="flex flex-col w-full xl:w-1/2 gap-2">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    v-model="formData.FechaNacimiento"
                    class="w-full border py-3 px-5 rounded"
                    required
                  />
                </div>

                <div class="flex flex-col w-full xl:w-1/2 gap-2">
                  <label>Teléfono</label>
                  <input
                    v-model="telefonoFormateado"
                    type="tel"
                    class="w-full border py-3 px-5 rounded-r"
                  />
                </div>
              </div>

              <!-- Dirección -->
              <div class="flex flex-col gap-6">
                <div class="flex flex-col w-full gap-2">
                  <label>Dirección</label>
                  <input
                    type="text"
                    v-model="formData.Direccion"
                    class="w-full border py-3 px-5 rounded"
                    required
                  />
                </div>
              </div>

              <!-- Botón -->
              <div class="flex justify-start">
                <button
                  type="submit"
                  :class="modoEdicion ? 'bg-yellow-600' : 'bg-primary'"
                  class="rounded p-3 text-white"
                >
                  {{ modoEdicion ? 'Modificar Datos' : 'Guardar Datos' }}
                </button>
              </div>

            </div>
          </form>
        </DefaultCard>

        <!-- ===================== -->
        <!-- TABLA PACIENTES -->
        <!-- ===================== -->
       <DefaultCard cardTitle="Listado de pacientes">

         <div class="overflow-x-auto">

            <table class="min-w-full divide-y divide-gray-200">

              <!-- HEADER -->
               <thead class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
             
                  <tr>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Fecha ingreso
                  </th>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Paciente
                  </th>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Fecha nacimiento
                  </th>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Teléfono
                  </th>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Dirección
                  </th>

                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Acciones
                  </th>
                  
                </tr>

              </thead>

              <!-- BODY -->
              <tbody class="divide-y divide-gray-100 bg-white">

                <tr
                  v-for="paciente in paginated"
                  :key="paciente.id"
                  class="hover:bg-blue-50/40 transition duration-200 even:bg-gray-50/40"
                >

                  <!-- FECHA INGRESO -->
                  <td class="px-6 py-4 whitespace-nowrap">

                    <div class="flex flex-col">
                      <span class="font-medium text-gray-800">
                        {{ formatearFecha(paciente.fecha) }}
                      </span>

                      <span class="text-xs text-gray-400">
                        Registro
                      </span>
                    </div>

                  </td>

                  <!-- NOMBRE -->
                  <td class="px-6 py-4">

                    <div class="flex items-center gap-3">

                      <!-- Avatar -->
                      <div
                        class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold"
                      >
                        {{ paciente.nombreCompleto?.charAt(0) }}
                      </div>

                      <div class="min-w-0">

                        <p class="font-semibold text-gray-800 truncate">
                          {{ paciente.nombreCompleto }}
                        </p>

                        <p class="text-xs text-gray-400">
                          Paciente registrado
                        </p>

                      </div>

                    </div>

                  </td>

                  <!-- NACIMIENTO -->
                  <td class="px-6 py-4 whitespace-nowrap">

                    <div class="flex flex-col">

                      <span class="text-gray-700">
                        {{ formatearFecha(paciente.fechaNacimiento) }}
                      </span>

                      <span class="text-xs text-gray-400">
                        Fecha nacimiento
                      </span>

                    </div>

                  </td>

                  <!-- TELÉFONO -->
                  <td class="px-6 py-4">

                    <span
                      class="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100"
                    >
                      📞 {{ paciente.telefono }}
                    </span>

                  </td>

                  <!-- DIRECCIÓN -->
                  <td class="px-6 py-4 max-w-[220px]">

                    <div
                      class="truncate text-gray-600"
                      :title="paciente.direccion"
                    >
                      {{ paciente.direccion }}
                    </div>

                  </td>

                  <!-- ACCIONES -->
                  <td class="px-6 py-4">

                    <div class="flex items-center justify-center gap-2">

                      <!-- EDITAR -->
                      <button
                        @click="editarCita(paciente)"
                        class="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-sm transition"
                      >
                        ✏️ Editar
                      </button>

                      <!-- ELIMINAR -->
                      <button
                        @click="eliminarCita(paciente.id)"
                        class="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-sm transition"
                      >
                        🗑 Eliminar
                      </button>

                    </div>

                  </td>

                </tr>

                <!-- VACÍO -->
                <tr v-if="paginated.length === 0">

                  <td colspan="6" class="py-10 text-center">

                    <div class="flex flex-col items-center justify-center text-gray-400">

                      <div class="text-5xl mb-2">
                        🩺
                      </div>

                      <p class="font-medium">
                        No hay pacientes registrados
                      </p>

                      <p class="text-sm text-gray-400">
                        Los pacientes aparecerán aquí
                      </p>

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>
          </div>

           <!-- ===================== -->
            <!-- PAGINACIÓN -->
            <!-- ===================== -->
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

            <br>

        </DefaultCard>

      </div>
    </div>
  </DefaultLayout>
</template>
