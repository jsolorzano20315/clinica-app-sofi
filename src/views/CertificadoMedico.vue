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
import QRCode from 'qrcode'

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
const pageTitle = ref('Constancia Medica')

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


const exportarPDFIndividual = async (cita: FormData) => {
  const doc = new jsPDF()

  // =============================
  // 🆔 CÓDIGO DE VALIDACIÓN
  // =============================
  const codigo = `CONST-${Date.now()}`
  const urlValidacion = `https://tusistema.com/validar/${codigo}`

  // Generar QR
  const qrBase64 = await QRCode.toDataURL(urlValidacion)

  // =============================
  // 🏥 LOGO
  // =============================
  try {
    doc.addImage('/logo.png', 'PNG', 14, 10, 25, 25)
  } catch (e) {
    console.warn('No se pudo cargar el logo')
  }

  // =============================
  // 🏥 ENCABEZADO
  // =============================
  const diasReposo = 3

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)

  doc.text(clinica || 'CLÍNICA MÉDICA', 105, 15, { align: 'center' })

  doc.setFontSize(12)
  doc.text('CONSTANCIA MÉDICA', 105, 22, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.text(`Código QR: ${codigo}`, 14, 30)

  doc.text(
    `Fecha: ${new Date().toLocaleDateString()}`,
    150,
    30
  )

  doc.line(14, 35, 196, 35)

  // =============================
  // 👤 CUERPO
  // =============================
  let y = 45

  doc.setFontSize(11)

  doc.text(
    `Yo, Dr(a). ${cita.nombreDoctor}, certifico que:`,
    14,
    y
  )

  y += 11

  doc.text(
    `El paciente ${cita.nombrePaciente}, fue atendido en esta clínica.`,
    14,
    y
  )

  y += 13

  doc.text(
    `Motivo de consulta / diagnóstico:`,
    14,
    y
  )

  y += 14

  // Diagnóstico
  autoTable(doc, {
    startY: y,
    body: [[cita.motivo]],
    theme: 'grid',
    styles: {
    fontSize: 10,
    cellPadding: 1, // 👈 reduce espacio interno
    lineColor: [0, 0, 0], // negro
    lineWidth: 0.0
  }
  })

  y = (doc as any).lastAutoTable.finalY + 10

  doc.text(
    `Se recomienda reposo por ${diasReposo} días según evaluación médica.`,
    14,
    y
  )

  y += 12

  doc.text(
    `Se extiende el presente documento a solicitud del interesado para los fines que estime convenientes.`,
    14,
    y
  )

  y += 60

  // =============================
  // ✍️ FIRMA
  // =============================
  doc.line(70, y, 130, y)

  y += 8

  doc.text('Firma y sello del médico', 100, y, { align: 'center' })

  // =============================
  // 🔳 QR DE VALIDACIÓN
  // =============================
  doc.addImage(qrBase64, 'PNG', 155, 40, 35, 35)

  doc.setFontSize(8)
  doc.text('Escanee para validar', 159, 78)

  // =============================
  // 📌 PIE
  // =============================
  const pageHeight = doc.internal.pageSize.height

  doc.setFontSize(8)
  doc.text(
    `Documento generado automáticamente por el sistema clínico. ${clinica}, Fecha: ${new Date().toLocaleDateString()}`,
    14,
    pageHeight - 10
  )

  // =============================
  // 💾 GUARDAR
  // =============================
  doc.save(`Constancia_${cita.nombrePaciente}.pdf`)
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
        <DefaultCard cardTitle="Lista de pacientes para ver constancia medica ">
        
          <div class="overflow-x-auto">
    
           <!-- TABLA PROFESIONAL CITAS MÉDICAS -->
            <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

              <div class="overflow-x-auto">

                <table class="min-w-full divide-y divide-gray-200">

                  <!-- HEADER -->
                  <thead class="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">

                    <tr>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Fecha cita
                      </th>

                      <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Paciente
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

                      <th class="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">
                        Acciones
                      </th>

                    </tr>

                  </thead>

                  <!-- BODY -->
                  <tbody class="divide-y divide-gray-100 bg-white">

                    <tr
                      v-for="cita in paginatedCitas"
                      :key="cita.id"
                      class="hover:bg-cyan-50 transition duration-200"
                    >

                      <!-- FECHA -->
                      <td class="px-6 py-4 whitespace-nowrap">

                        <div class="flex flex-col">

                          <span class="font-semibold text-gray-800">
                            {{ formatearFecha(cita.fecha) }}
                          </span>

                          <span class="text-xs text-gray-400">
                            Cita médica
                          </span>

                        </div>

                      </td>

                      <!-- PACIENTE -->
                      <td class="px-6 py-4">

                        <div class="flex items-center gap-3">

                          <!-- AVATAR -->
                          <div
                            class="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold"
                          >
                            {{ cita.nombrePaciente.charAt(0) }}
                          </div>

                          <div>

                            <p class="font-semibold text-gray-800">
                              {{ cita.nombrePaciente }}
                            </p>

                            <p class="text-xs text-gray-400">
                              Paciente registrado
                            </p>

                          </div>

                        </div>

                      </td>

                      <!-- TIPO -->
                      <td class="px-6 py-4">

                        <span
                          class="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          {{ cita.tipo }}
                        </span>

                      </td>

                      <!-- MOTIVO -->
                      <td class="px-6 py-4 max-w-sm">

                        <p class="text-sm text-gray-700 line-clamp-2">
                          {{ cita.motivo }}
                        </p>

                      </td>

                      <!-- ESTADO -->
                      <td class="px-6 py-4 text-center">

                        <span
                          class="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                          :class="{
                            'bg-green-100 text-green-700': cita.estado === 'Confirmada',
                            'bg-yellow-100 text-yellow-700': cita.estado === 'Pendiente',
                            'bg-blue-100 text-blue-700': cita.estado === 'ReprogramacionPendiente',
                            'bg-red-100 text-red-700': cita.estado === 'Cancelada'
                          }"
                        >
                          {{ cita.estado }}
                        </span>

                      </td>

                      <!-- ACCIONES -->
                      <td class="px-6 py-4">

                        <div class="flex justify-center">

                          <button
                            @click="exportarPDFIndividual(cita)"
                            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
                          >

                            <!-- ICONO PDF -->
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
                                d="M12 8v8m4-4H8"
                              />
                            </svg>

                            Constancia PDF

                          </button>

                        </div>

                      </td>

                    </tr>

                    <!-- SIN DATOS -->
                    <tr v-if="paginatedCitas.length === 0">

                      <td
                        colspan="6"
                        class="px-6 py-12 text-center"
                      >

                        <div class="flex flex-col items-center gap-3">

                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="w-14 h-14 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="1.5"
                              d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
                            />
                          </svg>

                          <p class="text-gray-500 font-medium">
                            No hay citas registradas
                          </p>

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
