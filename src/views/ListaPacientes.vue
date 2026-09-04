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

import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

/* =========================================================
⚙️ CONFIGURACIÓN
========================================================= */
const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''
const rol = localStorage.getItem("rol") || ''


const fechaInicio = ref('')
const fechaFin = ref('')

const pageTitle = ref('Lista de Pacientes')

/* =========================================================
🌐 API
========================================================= */
const API_URL = import.meta.env.VITE_API_URL

const cargarPacientes = async () => {
  try {
    
    const url = `${API_URL}/Pacientes/ListaReportePacientes/${encodeURIComponent(clinica)}/${fechaInicio.value}/${ajustarFechaFin(fechaFin.value)}`

    const res = await axios.get(url)
    pacientes.value = res.data ?? []

  } catch (err) {
    console.error(err)
    pacientes.value = []
  }
}

/* =========================================================
🧾 TIPOS
========================================================= */
interface Paciente {
  id: number
  nombreCompleto: string
  fechaNacimiento: string
  fecha: string
  telefono: string
  direccion: string
}

/* =========================================================
🔄 ESTADO REACTIVO
========================================================= */
const pacientes = ref<Paciente[]>([])
const searchPaciente = ref('')

const currentPage = ref(1)
const itemsPerPage = 10

const view = ref<'pacientes' | 'form' | 'citas'>('pacientes')

let primeraCarga = true


/* =========================================================
📅 FECHAS
========================================================= */
const setFechasPorDefecto = () => {
  const hoy = new Date()
  const hace30Dias = new Date()

  // mostrar los ultimos 30 registros aparir de fecha actual
  hace30Dias.setDate(hoy.getDate() - 30)

  const format = (date: Date) => date.toISOString().split('T')[0]

  fechaInicio.value = format(hace30Dias)
  fechaFin.value = format(hoy)
}

const ajustarFechaFin = (fecha: string) => {
  const f = new Date(fecha)
  f.setHours(23, 59, 59, 999)
  return f.toISOString()
}

/* =========================================================
📊 COMPUTED
========================================================= */
const filteredPacientes = computed(() => {
  const term = searchPaciente.value.toLowerCase().trim()

  if (!term) return pacientes.value

  return pacientes.value.filter(p =>
    (p.nombreCompleto ?? '').toLowerCase().includes(term)
  )
})

const paginatedPacientes = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredPacientes.value.slice(start, start + itemsPerPage)
})

const totalPages = computed(() =>
  Math.ceil(filteredPacientes.value.length / itemsPerPage) || 1
)

/* =========================================================
🛠️ UTILIDADES
========================================================= */
const formatearFecha = (fecha: string) => {
  if (!fecha) return ''

  const f = new Date(fecha)

  return `${String(f.getDate()).padStart(2, '0')}/${
    String(f.getMonth() + 1).padStart(2, '0')
  }/${f.getFullYear()}`
}

/* =========================================================
📤 EXPORTACIONES
========================================================= */
const exportarExcel = () => {
  const data = filteredPacientes.value.map(p => ({
    Fecha: formatearFecha(p.fecha),
    NombreCompleto: p.nombreCompleto,
    FechaNacimiento: formatearFecha(p.fechaNacimiento),
    Telefono: p.telefono,
    Direccion: p.direccion
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, ws, 'Pacientes')

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  saveAs(
    new Blob([buffer]),
    `Reporte_Pacientes_${new Date().toISOString().split('T')[0]}.xlsx`
  )
}

const exportarPDF = () => {
  const doc = new jsPDF()

  // =============================
  // 🏥 NOMBRE CLÍNICA (DINÁMICO)
  // =============================
  const clinicaNombre =
    filteredPacientes.value[0]?.clinica || 'CLÍNICA MÉDICA'

  // =============================
  // 🧾 ENCABEZADO
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
    'REPORTE DE PACIENTES',
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

  // Línea
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)

  // =============================
  // 📊 TABLA
  // =============================
  const data = filteredPacientes.value.map(p => [
    formatearFecha(p.fecha),
    p.nombreCompleto,
    formatearFecha(p.fechaNacimiento),
    p.telefono,
    p.direccion
  ])

  autoTable(doc, {
    startY: 38,

    head: [[
      'Fecha ingreso',
      'Nombre',
      'Fecha nacimiento',
      'Teléfono',
      'Dirección'
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
      0: { cellWidth: 25 }, // Fecha ingreso
      1: { cellWidth: 45 }, // Nombre
      2: { cellWidth: 30 }, // Fecha nacimiento
      3: { cellWidth: 30 }, // Teléfono
      4: { cellWidth: 56 }  // Dirección
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
    'Documento generado automáticamente por el sistema clínico',
    14,
    pageHeight - 10
  )

  doc.text(
    'Página 1',
    180,
    pageHeight - 10
  )

  // =============================
  // 💾 GUARDAR
  // =============================
  doc.save(`Reporte_Pacientes_${Date.now()}.pdf`)
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

  cargarPacientes()
})

/* =========================================================
🚀 LIFECYCLE
========================================================= */
onMounted(async () => {
  setFechasPorDefecto()
  await cargarPacientes()
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
                    v-model="searchPaciente"
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
                    @click="cargarPacientes"
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
            <!-- TABLA PACIENTES -->
            <!-- ===================== -->
            <DefaultCard cardTitle="Lista de Pacientes">

            <div class="overflow-x-auto">

              <!-- TABLA PROFESIONAL PACIENTES -->
<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

  <div class="overflow-x-auto">

     <!-- TABLA PROFESIONAL PACIENTES -->
         <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

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

                </tr>

              </thead>

              <!-- BODY -->
              <tbody class="divide-y divide-gray-100 bg-white">

                <tr
                  v-for="paciente in paginatedPacientes"
                  :key="paciente.id"
                  class="hover:bg-emerald-50 transition"
                >

                  <!-- FECHA INGRESO -->
                  <td class="px-6 py-4 whitespace-nowrap">

                    <div class="text-sm font-semibold text-gray-800">
                      {{ formatearFecha(paciente.fecha) }}
                    </div>

                    <div class="text-xs text-gray-400">
                      Registro
                    </div>

                  </td>

                  <!-- PACIENTE -->
                  <td class="px-6 py-4">

                    <div class="flex items-center gap-3">

                      <!-- AVATAR -->
                      <div
                        class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold"
                      >
                        {{ paciente.nombreCompleto.charAt(0) }}
                      </div>

                      <div>

                        <p class="font-semibold text-gray-800">
                          {{ paciente.nombreCompleto }}
                        </p>

                        <p class="text-xs text-gray-400">
                          Paciente activo
                        </p>

                      </div>

                    </div>

                  </td>

                  <!-- FECHA NACIMIENTO -->
                  <td class="px-6 py-4 text-sm text-gray-700">
                    {{ formatearFecha(paciente.fechaNacimiento) }}
                  </td>

                  <!-- TELÉFONO -->
                  <td class="px-6 py-4">

                    <span class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      📞 {{ paciente.telefono }}
                    </span>

                  </td>

                  <!-- DIRECCIÓN -->
                  <td class="px-6 py-4 max-w-[250px]">

                    <p class="text-sm text-gray-700 truncate">
                      {{ paciente.direccion }}
                    </p>

                  </td>

                </tr>

                <!-- VACÍO -->
                <tr v-if="paginatedPacientes.length === 0">

                  <td colspan="5" class="px-6 py-12 text-center text-gray-500">

                    <div class="flex flex-col items-center gap-2">

                      <span class="text-4xl">🧑‍⚕️</span>

                      <p class="font-medium">
                        No hay pacientes registrados
                      </p>

                    </div>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>

        </div>

      </div>

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
          <br>
        </div>
      </div>
    </div>

  </DefaultLayout>
</template>