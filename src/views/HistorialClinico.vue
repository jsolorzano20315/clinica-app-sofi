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
const logo = '/logo.png' // o base64

/* =========================================================
   🌐 API
========================================================= */
const API_URL = import.meta.env.VITE_API_URL

const API = {
  citas: () =>
    `${API_URL}/Historial/HistorialClinico/${encodeURIComponent(clinica)}`
}


/* =========================================================
   🏷️ TÍTULO
========================================================= */
const pageTitle = ref('Historial Clinico por Paciente')

/* =========================================================
   🔄 ESTADOS REACTIVOS
========================================================= */
const pacientes = ref<Paciente[]>([])
const citas = ref<FormData[]>([])
const doctores = ref<any[]>([])

const searchCita = ref('')

const currentPageCitas = ref(1)
const itemsPerPageCitas = 10

const view = ref<'pacientes' | 'form' | 'citas'>('pacientes')

let primeraCarga = true

/* =========================================================
   🧾 TIPOS
========================================================= */
interface Paciente {
  nombrePaciente: string
}

interface FormData {
  Motivos: string
  Telefono: string
  NombrePaciente: string
  UltimaFechaCita: string
  TotalCitas: number
  Clinica: string
}

/* =========================================================
   📡 FUNCIONES API
========================================================= */

const cargarCitas = async () => {
  //if (!fechaInicio.value || !fechaFin.value) return

  try {
    const res = await axios.get(API.citas())

    const lista =
      res.data?.data ||
      res.data ||
      []

    citas.value = lista.map((c: any) => ({
      Motivos: c.Motivos ?? c.motivos,
      Telefono: c.Telefono ?? c.telefono ?? c.Telefono,
      NombrePaciente: c.NombrePaciente ?? c.nombrePaciente,
      UltimaFechaCita: c.UltimaFechaCita ?? c.ultimaFechaCita,
      TotalCitas: c.TotalCitas ?? c.totalCitas,
      Clinica: c.Clinica ?? c.clinica
    }))

    console.log('CITAS LIMPIAS:', citas.value)

  } catch (error) {
    console.error(error)
  }
}

/* =========================================================
   📅 FECHAS
========================================================= */
const setFechasPorDefecto = () => {
  const hoy = new Date()
   const hace30Dias = new Date()

// mostrar los ultimos 30 registros aparir de fecha actual
 //  hace30Dias.setDate(hoy.getDate() - 30)

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

const filteredCitas = computed(() => {
  const term = searchCita.value.toLowerCase().trim()
  if (!term) return citas.value

  return citas.value.filter(cita =>
    (
      cita.NombrePaciente +
      cita.Telefono +
      cita.Motivos +
      cita.Clinica +
      formatearFecha(cita.UltimaFechaCita)
    )
      .toLowerCase()
      .includes(term)
  )
})

const paginatedCitas = computed(() => {
  const start = (currentPageCitas.value - 1) * itemsPerPageCitas
  return filteredCitas.value.slice(start, start + itemsPerPageCitas)
})

const totalPagesCitas = computed(() =>
  Math.ceil(filteredCitas.value.length / itemsPerPageCitas) || 1
)

/* =========================================================
   📤 EXPORTACIONES
========================================================= */
const exportarExcel = () => {
  const source = filteredCitas.value || []

  const data = source.map(cita => ({
    Paciente: cita.NombrePaciente,
    Teléfono: cita.Telefono,
    "Historial Clinico": cita.Motivos,
    "Fecha Última Cita": formatearFecha(cita.UltimaFechaCita),
    "Total Citas": cita.TotalCitas,
     Clínica: cita.Clinica
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Citas')

  XLSX.writeFile(wb, `Reporte_${Date.now()}.xlsx`)
}

const exportarPDF = () => {
  const doc = new jsPDF()

  const clinicaNombre =
    filteredCitas.value[0]?.Clinica || 'CLÍNICA MÉDICA'

  // =============================
  // 🏥 ENCABEZADO
  // =============================
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)

  doc.text(
    clinicaNombre.toUpperCase(),
    105,
    15,
    { align: 'center' }
  )

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')

  doc.text(
    'REPORTE DE HISTORIAL CLÍNICO',
    105,
    22,
    { align: 'center' }
  )

  doc.text(
    `Fecha: ${new Date().toLocaleDateString()}`,
    105,
    28,
    { align: 'center' }
  )

  // Línea separadora
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)

  // =============================
  // 📊 TABLA
  // =============================
  const data = filteredCitas.value.map(cita => [
    cita.NombrePaciente,
    cita.Telefono,
    cita.Motivos,
    formatearFecha(cita.UltimaFechaCita),
    cita.TotalCitas,
    cita.Clinica
  ])

  autoTable(doc, {
    startY: 38,

    head: [[
      'Paciente',
      'Teléfono',
      'Historial clínico',
      'Última Cita',
      'Total Citas',
      'Clínica'
    ]],

    body: data,

    styles: {
      fontSize: 9,
      cellPadding: 3,
      valign: 'middle'
    },

    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center'
    },

    columnStyles: {
      0: { cellWidth: 30 }, // Paciente
      1: { cellWidth: 25 }, // Teléfono
      2: { cellWidth: 50 }, // Historial
      3: { cellWidth: 25 }, // Fecha
      4: { cellWidth: 20 }, // Total
      5: { cellWidth: 30 }  // Clínica
    },

    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },

    margin: { left: 14, right: 14 }
  })

  // =============================
  // 📌 PIE DE PÁGINA
  // =============================
  const pageHeight = doc.internal.pageSize.height

  doc.setFontSize(8)

  doc.text(
    `Documento generado automáticamente por el sistema clínico. ${clinica}, Fecha: ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  )

  doc.text(
    `Página 1`,
    180,
    pageHeight - 10
  )

  // =============================
  // 💾 GUARDAR
  // =============================
  doc.save(`Reporte_Citas_${Date.now()}.pdf`)
}

const exportarPDFIndividual = (cita: FormData) => {
  const doc = new jsPDF()

  // =============================
  // 🏥 LOGO
  // =============================
  const logo = '/logo.png' // 👈 cambia esto por tu logo real

  try {
    doc.addImage(logo, 'PNG', 14, 10, 30, 30)
  } catch (e) {
    console.warn('No se pudo cargar el logo')
  }

  // =============================
  // 🏥 ENCABEZADO
  // =============================
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(cita.Clinica || 'CLÍNICA MÉDICA', 50, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Reporte de Historial Clínico', 60, 24)

  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 18)

  // Línea separadora
  doc.setLineWidth(0.5)
  doc.line(14, 35, 196, 35)

  // =============================
  // 👤 DATOS DEL PACIENTE
  // =============================
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del Paciente', 14, 45)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  doc.text(`Nombre: ${cita.NombrePaciente}`, 14, 52)
  doc.text(`Teléfono: ${cita.Telefono}`, 14, 58)
  //doc.text(`Clínica: ${cita.Clinica}`, 14, 64)
  doc.text(`Última cita: ${formatearFecha(cita.UltimaFechaCita)}`, 14, 64)
  doc.text(`Total citas: ${cita.TotalCitas}`, 14, 70)

  // =============================
  // 📋 TABLA HISTORIAL
  // =============================
  autoTable(doc, {
    startY: 76,
    head: [['Historial clínico']],
    body: [[cita.Motivos]],
    styles: {
      fontSize: 10,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      halign: 'center'
    }
  })

  // =============================
  // 📌 PIE DE PÁGINA
  // =============================
  const pageHeight = doc.internal.pageSize.height

  doc.setFontSize(8)
  doc.text(
    `Documento generado automáticamente por el sistema clínico. Telefono: ${cita.Telefono}, ${clinica}, Fecha: ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  )

  doc.text(
    `Página 1`,
    180,
    pageHeight - 10
  )

  // =============================
  // 💾 GUARDAR
  // =============================
  doc.save(`Historial_${cita.NombrePaciente}.pdf`)
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
   // setFechasPorDefecto()
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

              <!-- FECHA INICIO 
              <div>
                <label class="text-sm text-gray-600 mb-1 block">
                  Fecha inicio
                </label>

                <input
                  v-model="fechaInicio"
                  type="date"
                  class="border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>-->

              <!-- FECHA FIN 
              <div>
                <label class="text-sm text-gray-600 mb-1 block">
                  Fecha fin
                </label>

                <input
                  v-model="fechaFin"
                  type="date"
                  class="border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>-->

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

                <!-- EXPORTAR PDF 
                  <button
                    @click="exportarPDF"
                    class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                  >
                    PDF
                  </button>-->
              </div>

            </div>

          </div>

          <!-- ===================== -->
          <!-- TABLA CITAS -->
          <!-- ===================== -->
        <DefaultCard cardTitle="Gestión de Historial Clínico y Citas Médicas">
          <div class="overflow-x-auto">

           <!-- TABLA PROFESIONAL -->
          <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div class="overflow-x-auto">

              <table class="min-w-full divide-y divide-gray-200">

                <!-- HEADER -->
                <thead class="bg-gradient-to-r from-blue-600 to-blue-500 text-white">

                  <tr>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Última cita
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Paciente
                    </th>

                    <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                      Historial clínico
                    </th>

                    <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Total citas
                    </th>

                    <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                      Acciones
                    </th>

                  </tr>

                </thead>

                <!-- BODY -->
                <tbody class="divide-y divide-gray-100 bg-white">

                  <tr
                    v-for="(cita, index) in paginatedCitas"
                    :key="index"
                    class="hover:bg-blue-50 transition duration-200"
                  >

                    <!-- FECHA -->
                    <td class="px-6 py-4 whitespace-nowrap">

                      <div class="flex flex-col">

                        <span class="text-sm font-semibold text-gray-800">
                          {{ formatearFecha(cita.UltimaFechaCita) }}
                        </span>

                        <span class="text-xs text-gray-400">
                          Última atención
                        </span>

                      </div>

                    </td>

                    <!-- PACIENTE -->
                    <td class="px-6 py-4">

                      <div class="flex items-center gap-3">

                        <!-- AVATAR -->
                        <div
                          class="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold"
                        >
                          {{ cita.NombrePaciente.charAt(0) }}
                        </div>

                        <div>

                          <p class="font-semibold text-gray-800">
                            {{ cita.NombrePaciente }}
                          </p>

                          <p class="text-xs text-gray-400">
                            Paciente registrado
                          </p>

                        </div>

                      </div>

                    </td>

                    <!-- HISTORIAL -->
                    <td class="px-6 py-4 max-w-md">

                      <div
                        class="text-sm text-gray-700 line-clamp-2"
                      >
                        {{ cita.Motivos }}
                      </div>

                    </td>

                    <!-- TOTAL CITAS -->
                    <td class="px-6 py-4 text-center">

                      <span
                        class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700"
                      >
                        {{ cita.TotalCitas }}
                      </span>

                    </td>

                    <!-- ACCIONES -->
                    <td class="px-6 py-4">

                      <div class="flex justify-center">

                        <button
                          @click="exportarPDFIndividual(cita)"
                          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
                        >

                          <!-- ICONO -->
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M12 11c0 .552-.448 1-1 1s-1-.448-1-1 .448-1 1-1 1 .448 1 1zm0 0V7m0 4h4m-4 0H8m13 1a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>

                          Ver PDF

                        </button>

                      </div>

                    </td>

                  </tr>

                  <!-- SIN DATOS -->
                  <tr v-if="paginatedCitas.length === 0">

                    <td
                      colspan="5"
                      class="px-6 py-10 text-center text-gray-500"
                    >

                      <div class="flex flex-col items-center gap-2">

                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-12 h-12 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="1.5"
                            d="M9 17v-2a4 4 0 018 0v2m-4-6a4 4 0 100-8 4 4 0 000 8z"
                          />
                        </svg>

                        <p class="font-medium">
                          No hay citas registradas
                        </p>

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
          <br>

        </div>
      </div>
    </div>

  </DefaultLayout>
</template>