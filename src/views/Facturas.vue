<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed, nextTick } from 'vue'
import html2pdf from "html2pdf.js"
import { onMounted } from 'vue'
import axios from 'axios'

// Título
const pageTitle = ref('Facturación')

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

const API_URL_GuardarFactura = `${API_URL}/Facturacion/GuardarFactura`

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

/* =========================================================
   🔄 ESTADOS REACTIVOS
   Datos principales + UI (paginación, filtros, vista)
========================================================= */
const pacientes = ref<Paciente[]>([])
const doctores = ref<Doctor[]>([])
const facturaId = ref(Date.now())

const searchPaciente = ref('')
const selectedPaciente = ref<number | null>(null)

const currentPage = ref(1)
const itemsPerPage = 12

const imprimirPDF = ref(false)

const view = ref<'pacientes' | 'form' | 'factura'>('pacientes') 


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

const primerDoctor = computed(() =>
  doctores.value.find(d => d.email === email) ?? null
)

const paginatedPacientes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPacientes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(filteredPacientes.value.length / itemsPerPage) || 1
)

const pacienteSeleccionado = computed(() => {
  return pacientes.value.find(p => p.id === formData.value.PacienteId)
})


// Formulario
const formData = ref({
  PacienteId: 0,
  DoctorId: 0,
  Fecha: '',
  Motivo: '',
  Estado: '',
  nombreDoctor: ''
})

//MENSAJES
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

const mensaje = ref('')
const tipoMensaje = ref<'success' | 'error' | 'warning'>('success')
const mostrarMensaje = ref(false)

const mostrarAlerta = async (
  texto: string,
  tipo: 'success' | 'error' | 'warning' = 'success'
) => {

  mensaje.value = texto
  tipoMensaje.value = tipo

  mostrarMensaje.value = false

  await nextTick()

  mostrarMensaje.value = true

  setTimeout(() => {
    mostrarMensaje.value = false
  }, 3000)
}

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

const puedeAgregarServicio = computed(() => {
  return (
    nuevoServicio.value.trim().length > 1 &&
    nuevoPrecio.value !== null &&
    nuevoPrecio.value > 0
  )
})

// Servicios
const servicios = ref([{ nombre: 'CONSULTA', precio: 500 }])
const nuevoServicio = ref('')
const nuevoPrecio = ref(0)

// Flag para ocultar elementos en PDF
const paraPDF = ref(false)

/* =========================================================
   🧩 FUNCIONES PRINCIPALES
   Selección de paciente, envío de formulario y control UI
========================================================= */
// Selecciona paciente y pasa a vista de factura
const seleccionarPaciente = async (id: number) => {
  formData.value.PacienteId = id

  await nextTick()

  view.value = 'factura'
}

const puedeGuardar = computed(() => {
  return servicios.value.length > 0 &&
    servicios.value.every(s => s.nombre?.trim() && s.precio > 0)
})

const validarServicios = () => {
  for (const servicio of servicios.value) {
    const nombre = servicio.nombre?.trim()
    const precio = servicio.precio

    if (!nombre || precio <= 0) {
      mostrarAlerta("Completa el servicio y el precio", "warning")
      return false
    }
  }

  return true
}

const guardandoFactura = ref(false)

//🧾 Método guardarFactura
const guardarFactura = async () => {

  if (guardandoFactura.value) return

  try {

    if (!validarServicios()) return
    if (!puedeGuardar.value) return

    guardandoFactura.value = true

    const payload = {
      PacienteId: formData.value.PacienteId,
      Fecha: new Date().toISOString(),
      Total: totalFactura.value,
      Clinica: clinica
    }

    console.log("Payload enviado:", payload)

    const response = await axios.post(
      API_URL_GuardarFactura,
      payload,
      {
        timeout: 10000 // 10 segundos
      }
    )

    console.log("Respuesta API:", response.data)

    mostrarAlerta(
      "Factura guardada correctamente",
      "success"
    )

    // mostrar botón pdf
    imprimirPDF.value = true

    // esperar cierre del modal
    setTimeout(() => {

      resetFormulario()

    }, 3000)

  } catch (error: any) {

    console.error("ERROR GUARDAR:", error)

    if (error.code === 'ECONNABORTED') {

      mostrarAlerta(
        "La API tardó demasiado en responder",
        "error"
      )

    } else {

      mostrarAlerta(
        error.response?.data?.message ||
        error.message ||
        "Error al guardar",
        "error"
      )

    }

  } finally {

    guardandoFactura.value = false

  }
}

//🧾 Método agregarServicio
const agregarServicio = () => {
  if (!nuevoServicio.value || nuevoPrecio.value <= 0) {
    mostrarAlerta("Completa el servicio y el precio", "warning")
    return
  }

  servicios.value.push({
    nombre: nuevoServicio.value,
    precio: nuevoPrecio.value
  })

  nuevoServicio.value = ''
  nuevoPrecio.value = 0
}

// Editar servicio
const actualizarServicio = (index: number, campo: 'nombre' | 'precio', valor: string | number) => {
  if (campo === 'nombre') servicios.value[index].nombre = valor as string
  else servicios.value[index].precio = Number(valor)
}

// Eliminar servicio
const eliminarServicio = (index: number) => {
  servicios.value.splice(index, 1)
}

// Total de la factura
const totalFactura = computed(() =>
  servicios.value.reduce((sum, s) => sum + s.precio, 0)
)

// Resetear servicios
const resetFormulario = () => {

  // limpiar formulario
  formData.value = {
    PacienteId: 0,
    DoctorId: 0,
    Fecha: '',
    Motivo: '',
    Estado: '',
    nombreDoctor: ''
  }

  // reset servicios
  servicios.value = [
    {
      nombre: 'CONSULTA',
      precio: 500
    }
  ]

  // ocultar pdf
  imprimirPDF.value = false

  // nueva factura
  facturaId.value = Date.now()

  // volver al inicio
  view.value = 'pacientes'

}

// PDF
const generarPDF = () => {
  paraPDF.value = true

  nextTick(() => {
    const element = document.getElementById("factura")

    if (!element) {
      console.error("No se encontró el elemento #factura")
      paraPDF.value = false
      return
    }

    html2pdf().set({
      margin: 10,
      filename: 'factura.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    }).from(element).save().finally(() => {
      paraPDF.value = false
    })
  })
}

/* =========================================================
   🚀 CICLO DE VIDA
   Carga inicial de datos al montar componente
========================================================= */
onMounted(async () => {
  await cargarPacientes()
  await cargarDoctores()
  console.log("Pacientes cargados:", pacientes.value)

})
</script>

<template>
  <DefaultLayout>

    <BreadcrumbDefault :pageTitle="pageTitle" />

    <!-- ===================== -->
    <!-- CONTENEDOR GLOBAL -->
    <!-- ===================== -->
    <div class="flex justify-center bg-gray-100 min-h-screen p-6">

      <div class="w-full max-w-7xl">

    <!-- ===================== -->
    <!-- MODAL MENSAJE -->
    <!-- ===================== -->
    <div
      v-if="mostrarMensaje"
      class="fixed inset-0 z-[9999] flex items-center justify-center"
    >

        <!-- Fondo -->
        <div class="absolute inset-0 bg-black/30"></div>

        <!-- Modal -->
        <div
          class="relative z-10 bg-white rounded-2xl shadow-2xl px-10 py-8 text-center w-[320px]"
        >

          <div class="flex justify-center mb-4">

            <div
              class="w-20 h-20 rounded-full border-4 flex items-center justify-center"
              :class="{
                'border-green-500 text-green-500': tipoMensaje === 'success',
                'border-red-500 text-red-500': tipoMensaje === 'error',
                'border-yellow-500 text-yellow-500': tipoMensaje === 'warning'
              }"
            >

              <svg
                class="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                v-html="configTipo.icon"
              ></svg>

            </div>

          </div>

          <h2 class="text-2xl font-semibold text-gray-800 mb-2">
            {{ configTipo.title }}
          </h2>

          <p class="text-gray-500 mb-6">
            {{ mensaje }}
          </p>

        </div>

      </div>
       
        <!-- ===================== -->
        <!-- LISTA PACIENTES -->
        <!-- ===================== -->
        <div v-if="view === 'pacientes'">

          <input
            v-model="searchPaciente"
            type="text"
            placeholder="Buscar paciente..."
            class="w-full mb-4 p-2 border rounded bg-white"
          />

          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

            <div
              v-for="paciente in paginatedPacientes"
              :key="paciente.id"
              class="bg-white rounded-lg shadow p-4 flex flex-col"
            >

              <div class="text-lg font-bold text-center">
                {{ paciente.nombreCompleto }}
              </div>

              <button
                @click="seleccionarPaciente(paciente.id)"
                class="mt-4 bg-blue-600 text-white py-1 rounded"
              >
                Seleccionar
              </button>

            </div>

          </div>

        </div>

        <!-- ===================== -->
        <!-- FACTURA ERP --->
        <!-- ===================== -->
        <div
  v-if="view === 'factura'"
  class="flex justify-center px-2 sm:px-4 lg:px-6 py-4"
>
  <div
    id="factura"
    class="bg-white w-full max-w-4xl shadow-xl rounded-2xl p-3 sm:p-5 md:p-8 text-gray-800 overflow-hidden"
  >

    <!-- HEADER -->
    <div
      class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b pb-4 mb-5"
    >

      <div class="text-center sm:text-left">
        <h1 class="text-lg sm:text-xl md:text-2xl font-bold uppercase">
          Factura Médica
        </h1>

        <p class="text-xs sm:text-sm text-gray-500">
          Sistema Clínico ERP
        </p>
      </div>

      <div class="text-center sm:text-right">
        <p class="text-xs sm:text-sm text-gray-500">
          No. Factura
        </p>

        <p class="font-bold text-lg sm:text-2xl text-blue-700">
          #{{ facturaId }}
        </p>
      </div>

    </div>

    <!-- PACIENTE / DOCTOR -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-5 text-sm"
    >

      <div
        class="bg-gray-50 p-4 rounded-xl border"
      >
        <p class="text-gray-500 text-xs sm:text-sm">
          Paciente
        </p>

        <p class="font-semibold text-sm sm:text-base break-words">
          {{ pacientesCRUD.find(p => p.id === formData.PacienteId)?.nombreCompleto }}
        </p>
      </div>

      <div
        class="bg-gray-50 p-4 rounded-xl border"
      >
        <p class="text-gray-500 text-xs sm:text-sm">
          Doctor
        </p>

        <p class="font-semibold text-sm sm:text-base break-words">
          {{ primerDoctor?.nombreDoctor || '' }}
        </p>
      </div>

    </div>

    <!-- TABLA RESPONSIVE -->
    <div class="overflow-x-auto rounded-xl border">

      <table
        class="w-full min-w-[600px] table-fixed text-xs sm:text-sm"
      >

        <!-- HEADER -->
        <thead class="bg-gray-100">

          <tr>

            <th
              class="w-[65%] border-b border-gray-300 p-2 sm:p-3 text-left font-semibold"
            >
              Servicio
            </th>

            <th
              class="w-[20%] border-b border-gray-300 p-2 sm:p-3 text-right font-semibold"
            >
              Precio
            </th>

            <th
              v-if="!paraPDF"
              class="w-[15%] border-b border-gray-300 p-2 sm:p-3 text-center font-semibold"
            >
              Acción
            </th>

          </tr>

        </thead>

        <!-- BODY -->
        <tbody>

          <tr
            v-for="(s, index) in servicios"
            :key="index"
            class="border-b border-gray-200 align-top"
          >

            <!-- SERVICIO -->
            <td class="p-2">

              <!-- NORMAL -->
              <input
                v-if="!paraPDF"
                v-model="s.nombre"
                class="w-full border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm"
              />

              <!-- PDF -->
              <div
                v-else
                class="whitespace-normal break-words"
              >
                {{ s.nombre }}
              </div>

            </td>

            <!-- PRECIO -->
            <td class="p-2">

              <input
                v-if="!paraPDF"
                v-model.number="s.precio"
                type="number"
                class="w-full border rounded-lg px-2 sm:px-3 py-2 text-right text-xs sm:text-sm"
              />

              <div
                v-else
                class="text-right"
              >
                L. {{ Number(s.precio).toFixed(2) }}
              </div>

            </td>

            <!-- ACCION -->
            <td
              v-if="!paraPDF"
              class="p-2 text-center"
            >

              <button
                @click="eliminarServicio(index)"
                class="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-2 rounded-lg transition text-xs sm:text-sm"
              >
                🗑
              </button>

            </td>

          </tr>

        </tbody>

      </table>

    </div>

    <!-- AGREGAR -->
    <div
      v-if="!paraPDF"
      class="flex flex-col md:flex-row gap-3 mt-5"
    >

      <input
        v-model="nuevoServicio"
        class="flex-1 border rounded-xl px-4 py-3 text-sm"
        placeholder="Servicio"
      />

      <input
        v-model.number="nuevoPrecio"
        type="number"
        class="w-full md:w-40 border rounded-xl px-4 py-3 text-right text-sm"
        placeholder="Precio"
      />

      <button
        @click="agregarServicio"
        class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition"
      >
        Agregar
      </button>

    </div>

    <!-- TOTAL -->
    <div
      class="mt-6 flex justify-center sm:justify-end"
    >

      <div
        class="bg-gray-50 p-4 rounded-2xl w-full sm:w-72 text-right border shadow-sm"
      >

        <p class="text-gray-500 text-sm">
          Total
        </p>

        <p
          class="text-2xl sm:text-3xl font-bold text-green-600 break-words"
        >
          L. {{ totalFactura }}
        </p>

      </div>

    </div>

    <!-- BOTONES -->
    <div
      v-if="!paraPDF"
      class="flex flex-col md:flex-row gap-3 md:justify-between mt-6"
    >

      <button
        @click="view='pacientes'; resetServicios()"
        class="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-xl transition"
      >
        Regresar
      </button>

      <div
        class="flex flex-col sm:flex-row gap-3"
      >

        <button
          @click="guardarFactura"
          :disabled="guardandoFactura"
          class="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl disabled:opacity-50 transition"
        >
          {{ guardandoFactura ? 'Guardando...' : 'Guardar' }}
        </button>

        <button
          @click="generarPDF"
          class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition"
        >
          PDF
        </button>

      </div>

    </div>

  </div>
</div>
       </div>
      </div>

  </DefaultLayout>
</template>