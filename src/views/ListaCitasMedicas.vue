<script setup lang="ts">
/* =========================================================
   📦 IMPORTS
========================================================= */
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

/* =========================================================
   ⚙️ CONFIGURACIÓN GENERAL
========================================================= */
const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''
const rol = localStorage.getItem("rol") || ''


const fechaInicio = ref('')
const fechaFin = ref('')

/* =========================================================
   🌐 API
========================================================= */
const API_URL = import.meta.env.VITE_API_URL

const API = {
  pacientes: `${API_URL}/Pacientes/ListaPacientes/${encodeURIComponent(clinica)}`,

  doctores: `${API_URL}/Doctores/ListaDoctores/${encodeURIComponent(clinica)}`,

  citas: () =>
    `${API_URL}/Citas/ListaReporteCitas/${encodeURIComponent(clinica)}/${fechaInicio.value}/${fechaFin.value}`
}

/* =========================================================
   🏷️ TÍTULO
========================================================= */
const pageTitle = ref('Lista de Citas Médicas')

/* =========================================================
   🔄 ESTADOS REACTIVOS
========================================================= */
const pacientes = ref<Paciente[]>([])
const citas = ref<FormData[]>([])
const doctores = ref<any[]>([])

const searchCita = ref('')

const currentPageCitas = ref(1)
const itemsPerPageCitas = ref(10)

const view = ref<'pacientes' | 'form' | 'citas'>('pacientes')

let primeraCarga = true

/* =========================================================
   🧾 TIPOS
========================================================= */
interface Paciente {
  nombrePaciente: string
}

interface FormData {
  id: number
  pacienteId: number
  doctorId: number
  fecha: string
  tipo: string
  telefono: string
  motivo: string
  estado: string
  nombrePaciente: string
  nombreDoctor: string
  especialidad: string
}

/* =========================================================
   📡 FUNCIONES API
========================================================= */
const cargarPacientes = async () => {
  try {
    const { data }: any = await axios.get(API.pacientes)

    pacientes.value =
      data?.data || data?.pacientes || (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error(error)
    pacientes.value = []
  }
}

const cargarDoctores = async () => {
  try {
    const { data }: any = await axios.get(API.doctores)

    doctores.value =
      data?.data || data?.doctores || (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error(error)
    doctores.value = []
  }
}

const cargarCitas = async () => {
  if (!fechaInicio.value || !fechaFin.value) return

  try {
  const { data } = await axios.get<FormData[]>(API.citas())
  citas.value = data
  } catch (error) {
    console.error('Error cargando citas:', error)
  }
}

/* =========================================================
   📅 FECHAS
========================================================= */
const setFechasPorDefecto = () => {
  const hoy = new Date()
  const hace30Dias = new Date()

// mostrar los ultimos 30 registros aparir de fecha actual
  hace30Dias.setDate(hoy.getDate() - 30)

  const format = (date: Date) => date.toISOString().split('T')[0]

  fechaFin.value = format(hoy)
  fechaInicio.value = format(hace30Dias)
}

const formatearFecha = (fecha: string) => {
  if (!fecha) return ''

  const f = new Date(fecha)
  const dia = String(f.getDate()).padStart(2, '0')
  const mes = String(f.getMonth() + 1).padStart(2, '0')
  const anio = f.getFullYear()

  return `${dia}/${mes}/${anio}`
}

/* =========================================================
   🔍 COMPUTED
========================================================= */
const totalRegistros = computed(() => filteredCitas.value.length)

const filteredCitas = computed(() => {
  const term = searchCita.value.toLowerCase().trim()
  if (!term) return citas.value

  return citas.value.filter(cita =>
    (
      cita.nombrePaciente +
      cita.nombreDoctor +
      cita.especialidad +
      cita.tipo +
      cita.motivo +
      cita.estado +
      formatearFecha(cita.fecha)
    )
      .toLowerCase()
      .includes(term)
  )
})

const paginatedCitas = computed(() => {
  const start = (currentPageCitas.value - 1) * itemsPerPageCitas.value
  return filteredCitas.value.slice(start, start + itemsPerPageCitas.value)
})

const totalPagesCitas = computed(() =>
  Math.ceil(filteredCitas.value.length / itemsPerPageCitas.value) || 1
)

const mostrarTodos = () => {
  itemsPerPageCitas.value = filteredCitas.value.length
  currentPageCitas.value = 1
}

/* =========================================================
   📤 EXPORTACIONES
========================================================= */
const exportarExcel = () => {
  const data = filteredCitas.value.map(cita => ({
    Fecha: formatearFecha(cita.fecha),
    Paciente: cita.nombrePaciente,
    Especialidad: cita.especialidad,
    Doctor: cita.nombreDoctor,
    Tipo: cita.tipo,
    Motivo: cita.motivo,
    Estado: cita.estado
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Citas')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  saveAs(
    new Blob([buffer], { type: 'application/octet-stream' }),
    `Reporte_Citas_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

const exportarPDF = () => {
  const doc = new jsPDF('landscape') // 👈 horizontal para que quepa todo mejor

  // =============================
  // 🏥 NOMBRE CLÍNICA
  // =============================
  const clinicaNombre =
    filteredCitas.value[0]?.clinica || 'CLÍNICA MÉDICA'

  // =============================
  // 🧾 ENCABEZADO
  // =============================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)

  doc.text(
    clinicaNombre.toUpperCase(),
    148,
    15,
    { align: 'center' }
  )

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  doc.text(
    'REPORTE DE CITAS MÉDICAS',
    148,
    22,
    { align: 'center' }
  )

  doc.text(
    `Fecha: ${new Date().toLocaleDateString()}`,
    148,
    28,
    { align: 'center' }
  )

  // Línea
  doc.setLineWidth(0.5)
  doc.line(14, 32, 283, 32)

  // =============================
  // 📊 TABLA
  // =============================
  const data = filteredCitas.value.map(cita => [
    formatearFecha(cita.fecha),
    cita.nombrePaciente,
    cita.especialidad,
    cita.nombreDoctor,
    cita.tipo,
    cita.motivo,
    cita.estado
  ])

  autoTable(doc, {
    startY: 38,

    head: [[
      'Fecha',
      'Paciente',
      'Especialidad',
      'Doctor',
      'Tipo',
      'Motivo',
      'Estado'
    ]],

    body: data,

    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle'
    },

    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center'
    },

    columnStyles: {
      0: { cellWidth: 25 }, // Fecha
      1: { cellWidth: 40 }, // Paciente
      2: { cellWidth: 35 }, // Especialidad
      3: { cellWidth: 40 }, // Doctor
      4: { cellWidth: 25 }, // Tipo
      5: { cellWidth: 70 }, // Motivo (más ancho 🔥)
      6: { cellWidth: 25 }  // Estado
    },

    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },

    margin: { left: 14, right: 14 },

    didParseCell: function (data) {
      // 👇 Ajuste para textos largos (motivo)
      if (data.column.index === 5) {
        data.cell.styles.cellWidth = 70
      }
    }
  })

  // =============================
  // 📌 PIE DE PÁGINA
  // =============================
  const pageHeight = doc.internal.pageSize.height

  doc.setFontSize(8)

  doc.text(
    'Documento generado automáticamente por el sistema clínico',
    14,
    pageHeight - 10
  )

  doc.text(
    'Página 1',
    260,
    pageHeight - 10
  )

  // =============================
  // 💾 GUARDAR
  // =============================
  doc.save(`Reporte_Citas_${Date.now()}.pdf`)
}

/* =========================================================
   👀 WATCHERS
========================================================= */
watch([fechaInicio, fechaFin], () => {
  if (!fechaInicio.value || !fechaFin.value) return

  if (primeraCarga) {
    primeraCarga = false
    return
  }

  cargarCitas()
})

/* =========================================================
   🚀 CICLO DE VIDA
========================================================= */
onMounted(async () => {
  try {
    await cargarPacientes()
    await cargarDoctores()

    setFechasPorDefecto()
    await cargarCitas()
 

  } catch (error) {
    console.error('Error inicializando datos:', error)
  }
})
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault :pageTitle="pageTitle" />

    <div class="flex justify-center">
      <div class="w-full max-w-7xl">

        <!-- ===================== -->
        <!-- LISTA PACIENTES -->
        <!-- ===================== -->
        <div v-if="view === 'pacientes'">

         <div class="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">

            <!-- FILTROS -->
            <div class="flex flex-col md:flex-row md:items-end gap-4">

              <!-- BUSCADOR -->
              <div class="flex-1">
                <label class="text-sm text-gray-600 mb-1 block">
                  Buscar
                </label>

                <input
                  v-model="searchCita"
                  type="text"
                  placeholder="Buqueda general"
                  class="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              <!-- FECHA INICIO -->
              <div>
                <label class="text-sm text-gray-600 mb-1 block">
                  Fecha inicio
                </label>

                <input
                  v-model="fechaInicio"
                  type="date"
                  class="border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <!-- FECHA FIN -->
              <div>
                <label class="text-sm text-gray-600 mb-1 block">
                  Fecha fin
                </label>

                <input
                  v-model="fechaFin"
                  type="date"
                  class="border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <!-- BOTÓN -->
              <div class="flex gap-2">
                <button
                  @click="cargarCitas"
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
                >
                  Filtrar
                </button>

                <!-- EXPORTAR EXCEL -->
                <button
                  @click="exportarExcel"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition flex items-center gap-2"
                >
                  Exportar Excel
                </button>

                <!-- EXPORTAR PDF -->
                  <button
                    @click="exportarPDF"
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                  >
                    PDF
                  </button>
              </div>

            </div>

          </div>

          <!-- ===================== -->
          <!-- TABLA CITAS -->
          <!-- ===================== -->
        <DefaultCard cardTitle="Lista de citas medicas">
        
          <div class="overflow-x-auto">
    
           <!-- TABLA PROFESIONAL COMPLETA -->
          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div class="overflow-x-auto">

              <table class="min-w-full divide-y divide-gray-200">

                <!-- HEADER -->
                <thead class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">

                  <tr>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Fecha cita
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Paciente
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Especialidad
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Doctor
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Tipo
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Motivo
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
                    class="hover:bg-indigo-50 transition"
                  >

                    <!-- FECHA -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-semibold text-gray-800">
                        {{ formatearFecha(cita.fecha) }}
                      </div>
                      <div class="text-xs text-gray-400">
                        Programada
                      </div>
                    </td>

                    <!-- PACIENTE -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">

                        <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {{ cita.nombrePaciente.charAt(0) }}
                        </div>

                        <div>
                          <p class="font-semibold text-gray-800">
                            {{ cita.nombrePaciente }}
                          </p>
                          <p class="text-xs text-gray-400">
                            Paciente
                          </p>
                        </div>

                      </div>
                    </td>

                    <!-- ESPECIALIDAD -->
                    <td class="px-6 py-4 text-sm text-gray-700">
                      {{ cita.especialidad }}
                    </td>

                    <!-- DOCTOR -->
                    <td class="px-6 py-4 text-sm text-gray-700">
                      {{ cita.nombreDoctor }}
                    </td>

                    <!-- TIPO -->
                    <td class="px-6 py-4">
                      <span class="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        {{ cita.tipo }}
                      </span>
                    </td>

                    <!-- MOTIVO -->
                    <td class="px-6 py-4 max-w-[200px]">
                      <p class="text-sm text-gray-700 truncate">
                        {{ cita.motivo }}
                      </p>
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
                    <td colspan="8" class="px-6 py-12 text-center text-gray-500">
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
           
         <!-- PAGINACIÓN PACIENTES -->
          <div class="flex justify-center mt-6 gap-2">
          <div class="mb-2 text-sm text-gray-600">
                Total registros: {{ totalRegistros }}
              </div>
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
            <!-- selector en el HTML -->
            <div>
                <label class="text-sm">Mostrar:</label>

                <select v-model.number="itemsPerPageCitas">
                  class="border p-2 rounded"
                >
                  <option :value="10">10</option>
                  <option :value="20">20</option>
                  <option :value="50">50</option>
                  <option :value="100">100</option>
                  <option :value="filteredCitas.length">Todos</option>
                </select>
              </div>
          </div>       
          </div>
          <br>

          </DefaultCard>
          <br>

        </div>
      </div>
    </div>

  </DefaultLayout>
</template>
