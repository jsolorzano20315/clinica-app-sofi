<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import axios from 'axios'
import { onBeforeUnmount } from 'vue'
import Swal from 'sweetalert2'
import { enviarWhatsAppAPI } from '@/services/whatsappService'

const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''

const mostrarAlertaRiesgo = ref(false)
const citasRiesgo = ref([])

// =====================
// 📲 ENVIAR RECORDATORIOS AUTOMÁTICOS
// =====================
const enviarRecordatoriosAutomaticos = async () => {

  const hoy = new Date()

  const hoyKey =
    hoy.getFullYear() + '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
    String(hoy.getDate()).padStart(2, '0')

  for (const fechaKey in eventos.value) {

    // 🔥 SOLO CITAS DEL DÍA ACTUAL
    if (fechaKey !== hoyKey) continue

    for (const evento of eventos.value[fechaKey]) {

      // 🔥 VALIDAR TELÉFONO
      if (!evento.telefono) continue

      try {

        // 🔥 EVITAR ENVIAR A CANCELADAS
        if (evento.estado === 'Cancelada') continue

        // 🔥 LLAMAR TU API NET 8
        await axios.post(
          'https://localhost:7147/api/WhatsApp/EnviarWhatsApp',
          {
            telefono: evento.telefono,
            mensaje:
              `Hola ${evento.nombreCompleto}, ` +
              `le recordamos tu cita programada para el día ${formatearFecha(fecha)}. ` +
              `Por favor confirma tu asistencia respondiendo a este mensaje.`
          }
        )

        console.log(
          `✅ WhatsApp enviado a ${evento.nombreCompleto}`
        )

      } catch (error) {

        console.error(
          `❌ Error enviando WhatsApp a ${evento.nombreCompleto}`,
          error
        )

      }
    }
  }
}

//FUNCIÓN PARA DETECTAR CITAS EN RIESGO
const detectarCitasRiesgo = () => {

  const lista: Evento[] = []

  const hoy = new Date()
  hoy.setHours(0,0,0,0)

  for (const fechaKey in eventos.value) {

    for (const evento of (eventos.value[fechaKey] || [])) {

      if (!evento) continue

      const fechaCita = new Date(fechaKey + "T00:00:00")
      fechaCita.setHours(0,0,0,0)

      const estado = calcularEstadoVisual(evento)

      if (estado === 'riesgo') {
        lista.push(evento)
      }
    }
  }

  citasRiesgo.value = lista
  mostrarAlertaRiesgo.value = lista.length > 0

  console.log("RIESGO DETECTADO:", lista)
}

// =====================
// 📡 URL BACKEND
// =====================

const API_URL = import.meta.env.VITE_API_URL

const API_URL_ListaDoctores = `${API_URL}/Doctores/ListaDoctores/${encodeURIComponent(email)}`

const API_URL_ListaCitas = `${API_URL}/Citas/ListaCitas/${encodeURIComponent(clinica)}`

const API_URL_ListaPacientes = `${API_URL}/Pacientes/ListaPacientes/${encodeURIComponent(clinica)}`

// =====================
// 📅 CALENDARIO
// =====================
const today = new Date()
const selectedMonth = ref(today.getMonth())
const selectedYear = ref(today.getFullYear())

// =====================
// CREAR evento (POST)
// =====================
const crearEventoAPI = async (evento: any, fechaKey: string) => {
  const payload = {
  pacienteId: evento.pacienteId,
  nombreCompleto: evento.nombreCompleto,
  fecha: fechaKey,
  hora: evento.hora,
  motivo: evento.motivo,
  telefono: evento.telefono,
  tipo: evento.tipo,
  estado: evento.estado,
  clinica: clinica,
  doctorId: doctorId.value ?? null
  }

  console.log("PAYLOAD FINAL CORRECTO:", payload)

  return await axios.post(
    `${API_URL}/Citas/GuardarCitas`,
    payload
  )
}

// =====================
// EDITAR evento (PUT)
// =====================
const editarEventoAPI = async (evento: Evento, fecha: string) => {
  return await axios.put(
    `${API_URL}/Citas/EditarCitas/${evento.id}`,
    {
      fecha,
      motivo: evento.motivo,
      pacienteId: evento.pacienteId,
      telefono: evento.telefono,
      hora: evento.hora,
      tipo: evento.tipo,
      estado: evento.estado
    }
  )
}

// =====================
// ELIMINAR evento (DELETE)
// =====================
const eliminarEventoAPI = async (id: number) => {
  await axios.delete(`${API_URL}/Citas/EliminarCitas/${id}`)
}


// =====================
// 📱 WHATSAPP CONTROL
// =====================
const autoWhatsApp = ref(true)

// =====================
// 🧠 MODELOS
// =====================
interface Evento {
  id?: number
  motivo: string
  pacienteId: number | null
  nombreCompleto: string 
  telefono: string
  fecha: string
  hora?: string
  tipo: string
  estado: string
  clinica: any,
  doctorId?: number | null 
}

interface Pacientes {
  id?: number
  nombreCompleto: string
  fechaNacimiento: string
  telefono: string
  direccion: string
}

interface Doctor {
  id: number
  nombreDoctor: string
  telefono?: string
  email: string
}

// =====================
// 🔥 DATA INICIAL
// =====================
const eventos = ref<Record<string, Evento[]>>({})
const doctores = ref<Doctor[]>([])

const cita = ref({
  fecha: '',
  pacienteId: null as number | null,
  nombreCompleto: '',
  motivo: '',
  telefono: '',
  hora: '',
  tipo: '',
  estado: 'Pendiente',
  clinica: null
})

// =====================
// 📱 WHATSAPP (PRO CLEAN)
// =====================
const formatearTelefono = (tel: string) => tel.replace(/\D/g, '')

const generarMensajeWhatsApp = (evento: Evento, fecha: string) => {
  const idSeguro = evento.id ?? 'sin-id'
  return (
    `Hola ${evento.nombreCompleto}\n\n` +
    `Le recordamos su cita para el ${formatearFecha(fecha)}:${evento.hora}.\n\n` +
    `[CONFIRMAR]\n` +
    `https://clinica-api-sofi.onrender.com/api/citas/confirmar/${idSeguro}\n\n` +
    `[CANCELAR]\n` +
    `https://clinica-api-sofi.onrender.com/api/citas/cancelar/${idSeguro}\n\n` +
    `[REPROGRAMAR]\n` +
    `https://clinica-api-sofi.onrender.com/api/citas/reprogramar/${idSeguro}\n\n` +
    `Saludos,\n${evento.clinica}`
  )
}

const enviarWhatsApp = (evento: Evento, fecha: string) => {
  if (!evento.telefono) {
    alert('Este evento no tiene teléfono')
    return
  }

  const telefonoLimpio = formatearTelefono(evento.telefono)

  const url = `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(
    generarMensajeWhatsApp(evento, fecha)
  )}`

  window.open(url, '_blank')
  
}

//Formatear fecha
const formatearFecha = (fecha: string) => {
  const [year, month, day] = fecha.split('-').map(Number)

  const localDate = new Date(year, month - 1, day)

  return localDate.toLocaleDateString('es-HN')
}

// =====================
// 🧩 MODAL
// =====================
const isPastDay = (dayKey: string) => {
  if (!dayKey) return false

  const [y, m, d] = dayKey.split('-').map(Number)

  return new Date(y, m - 1, d) <
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

const cargarEventosBackend = async () => {
  try {
    eventos.value = {}
    const res = await axios.get(API_URL_ListaCitas)

    res.data.forEach((cita: any) => {

      if (!cita) return   // 🔥 EVITA undefined

      // 🔥 LIMPIEZA AQUÍ
      let estado = cita.estado

      if (estado === 'riesgo') {
        estado = 'Pendiente'
      }

     const key = String(cita.fecha || '').split('T')[0]

if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) {
  console.error('❌ Fecha inválida recibida del backend:', cita.fecha)
  return
}

if (!eventos.value[key]) {
  eventos.value[key] = []
}

eventos.value[key].push({
  id: cita.id,
  motivo: cita.motivo,
  pacienteId: cita.pacienteid,
  nombreCompleto: cita.nombreCompleto,
  telefono: cita.telefono,
  fecha: key, // ⭐ IMPORTANTE
  tipo: cita.tipo,
  estado: estado,
  clinica: cita.clinica,
  doctorId: cita.doctorId,
  hora: (cita.hora || '').slice(0, 5)
})
    })

  } catch (err) {
    console.error(err)
  }
}

const pacientes = ref<Pacientes[]>([])

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
    console.error(err)
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


// =====================
// AUTOCOMPLETE 
// =====================
const busquedaPaciente = ref('')
const mostrarLista = ref(false)
const pacientesFiltrados = ref<Pacientes[]>([])

const filtrarPacientes = () => {
  const texto = busquedaPaciente.value.toLowerCase()

  pacientesFiltrados.value = pacientes.value.filter(p =>
    p.nombreCompleto.toLowerCase().includes(texto)
  )
}

const seleccionarPaciente = (p: Pacientes) => {
  cita.value.pacienteId = p.id ?? null
  cita.value.nombreCompleto = p.nombreCompleto   // 🔥 FIX REAL
  cita.value.telefono = p.telefono

  busquedaPaciente.value = p.nombreCompleto
  mostrarLista.value = false
}

onMounted(() => {

  document.addEventListener('click', (e: any) => {
    if (!e.target.closest('.relative')) {
      mostrarLista.value = false
    }
  })

  cargarDoctores().then(() => {
    const doc = doctores.value.find(d => d.email === email)
    if (doc) {
      doctorId.value = doc.id
    }
  })
})

const abrirModal = (dayKey: string, index: number | null = null) => {
  if (isPastDay(dayKey)) return

  selectedDay.value = dayKey
  editingIndex.value = index

  if (index !== null && eventos.value[dayKey]) {
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
// 🧩 UI STATE
// =====================
const selectedDay = ref<string | null>(null)
const editingIndex = ref<number | null>(null)
const doctorId = ref<number | null>(null)

// =====================
// ⏰ CONFIGURACIÓN HORARIO
// =====================
const horaMinima = '07:00'
const horaMaxima = '22:00'
const intervaloMinutos = 30

// =====================
// ⏰ HORA MÍNIMA DINÁMICA
// =====================
const horaMinimaDisponible = computed(() => {

  if (!selectedDay.value) {
    return horaMinima
  }

  const ahora = new Date()

  const hoyKey =
    ahora.getFullYear() + '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
    String(ahora.getDate()).padStart(2, '0')

  // ✅ si NO es hoy
  if (selectedDay.value !== hoyKey) {
    return horaMinima
  }

  // ✅ sumar 30 minutos
  ahora.setMinutes(
    Math.ceil(ahora.getMinutes() / intervaloMinutos) * intervaloMinutos
  )

  const h = String(ahora.getHours()).padStart(2, '0')
  const m = String(ahora.getMinutes()).padStart(2, '0')

  return `${h}:${m}`
})

//-------------------------
// Detectar horas ocupadas
//---------------------------
const horasOcupadas = computed(() => {

  if (!selectedDay.value) return []

  const citasDia = eventos.value[selectedDay.value] || []

  return citasDia.map(c => c.hora)

})
// -----------------------
// ⏰ VALIDAR SI LA HORA YA PASÓ
// -----------------------
const horaYaPaso = (hora: string) => {

  if (!selectedDay.value) return false

  const ahora = new Date()

  const hoyKey =
    ahora.getFullYear() + '-' +
    String(ahora.getMonth() + 1).padStart(2, '0') + '-' +
    String(ahora.getDate()).padStart(2, '0')

  // ✅ solo validar si es HOY
  if (selectedDay.value !== hoyKey) {
    return false
  }

  const [h, m] = hora.split(':').map(Number)

  const horaCita = new Date()

  horaCita.setHours(h, m, 0, 0)

  return horaCita <= ahora
}

// -----------------------
// ✅ VALIDAR DISPONIBILIDAD
// -----------------------
const horaDisponible = (hora: string) => {

  // ✅ NO permitir horas pasadas
  if (horaYaPaso(hora)) {
    return false
  }

  // ✅ si estoy editando permitir misma hora
  if (
    editingIndex.value !== null &&
    eventos.value[selectedDay.value!]
  ) {

    const actual =
      eventos.value[selectedDay.value!][editingIndex.value]

    if (actual.hora === hora) {
      return true
    }
  }

  // ✅ evitar horas ocupadas
  return !horasOcupadas.value.includes(hora)
}

// =====================
// 🚨 MODAL CONFIRMAR ELIMINAR
// =====================
const mostrarConfirmacionEliminar = ref(false)

const eventoAEliminar = ref<{
  dayKey: string
  index: number
} | null>(null)

// =====================
// ⚠️ ESTADO VISUAL (RIESGO)
// =====================
const calcularEstadoVisual = (evento: Evento) => {

  if (evento.estado !== 'Pendiente') {
    return evento.estado
  }

  const ahora = new Date()

  const hoyKey =
    `${ahora.getFullYear()}-` +
    `${String(ahora.getMonth() + 1).padStart(2, '0')}-` +
    `${String(ahora.getDate()).padStart(2, '0')}`

  // La fecha del evento ya está en formato YYYY-MM-DD
  const fechaEventoKey = String(evento.fecha || '').split('T')[0]

  if (fechaEventoKey === hoyKey) {
    return 'riesgo'
  }

  return evento.estado
}

// =====================
// 🔄 ACTUALIZAR SOLO DÍA SIGUIENTE (SIN TIMEZONE)
// =====================
const actualizarCitasVencidas = async () => {

  const hoy = new Date()
  const hoyKey =
    hoy.getFullYear() + '-' +
    String(hoy.getMonth() + 1).padStart(2, '0') + '-' +
    String(hoy.getDate()).padStart(2, '0')

  for (const fechaKey in eventos.value) {

    for (const evento of eventos.value[fechaKey]) {

      if (evento.estado !== 'Pendiente') continue

      // 🔥 DIFERENCIA REAL SIN DATE OBJECT
      const fechaCitaNum = Number(fechaKey.replaceAll('-', ''))
      const hoyNum = Number(hoyKey.replaceAll('-', ''))

      // 🔥 convertir a días (aproximación segura)
      const fechaCita = new Date(fechaKey + "T00:00:00")
      const hoyDate = new Date(hoyKey + "T00:00:00")

      const diffDias = Math.floor(
        (hoyDate.getTime() - fechaCita.getTime()) / (1000 * 60 * 60 * 24)
      )

      // 🔥 SOLO EXACTAMENTE 1 DÍA DESPUÉS
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

          console.log(`✅ Cita ${evento.id} cancelada correctamente`)

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
// 💾 GUARDAR EVENTO
// =====================
const guardarEvento = async () => {
  
  if (!selectedDay.value || !cita.value.motivo?.trim()) return

  if (!cita.value.hora) {

  Swal.fire({
    icon: 'warning',
    title: 'Seleccione una hora'
  })

  return
}

  const fechaKey = selectedDay.value

  // ✅ Construir el evento COMPLETO desde el inicio
  const nuevo: Evento = {
    fecha: fechaKey, // 🔥 OBLIGATORIO
    pacienteId: cita.value.pacienteId,
    nombreCompleto: cita.value.nombreCompleto,
    motivo: cita.value.motivo,
    telefono: cita.value.telefono,
    hora: cita.value.hora,
    tipo: "Consulta General",
    estado: "Pendiente",
    clinica: clinica,
    doctorId: doctorId.value 
  }

  try {

     let eventoWhatsApp: Evento = nuevo
     
    // =====================
    // ✏️ EDITAR
    // =====================
    if (editingIndex.value !== null) {
      const actual = eventos.value[fechaKey][editingIndex.value]

      // 🔥 mantener ID si existe
      const actualizado: Evento = {
        ...actual,
        ...nuevo,
        fecha: fechaKey
      }

      await editarEventoAPI(actualizado, fechaKey)

      eventos.value[fechaKey][editingIndex.value] = actualizado

      eventoWhatsApp = actualizado
    }

   // =====================
    // ➕ CREAR
    // =====================
    else {

      const getId = (data: any) =>
        data?.id || data?.citaId || data?.data?.id

      const creado = await crearEventoAPI(nuevo, fechaKey)
      console.log("🔥 RESPUESTA BACKEND:", creado.data)
      const id = getId(creado.data)

      if (!id) {
        console.error("❌ Backend no devolvió ID:", creado.data)
      }

      const eventoFinal: Evento = {
        ...nuevo,
        id
      }

      if (!eventos.value[fechaKey]) {
        eventos.value[fechaKey] = []
      }

      eventos.value[fechaKey].push(eventoFinal)

      eventoWhatsApp = eventoFinal
    }

    // =====================
    // 📲 WHATSAPP
    // =====================
    console.log("AUTO WHATSAPP:", autoWhatsApp.value)
    console.log("EVENTO:", eventoWhatsApp)

    if (autoWhatsApp.value === true) {
      enviarWhatsApp(eventoWhatsApp, fechaKey)
    }

    // =====================
    // 🔄 RESET
    // =====================
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
// 🗑 ABRIR MODAL ELIMINAR
// =====================
const eliminarEvento = (dayKey: string, index: number) => {

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

  const { dayKey, index } = eventoAEliminar.value

  const evento = eventos.value[dayKey][index]

  try {

    if (evento.id) {
      await eliminarEventoAPI(evento.id)
    }

    eventos.value[dayKey].splice(index, 1)

    if (eventos.value[dayKey].length === 0) {
      delete eventos.value[dayKey]
    }

  } catch (err) {

    console.error('Error eliminando', err)

  } finally {

    cancelarEliminarEvento()
  }
}

// =====================
// 📅 CALENDARIO
// =====================
const getDaysInMonth = (year: number, month: number) => {
  const date = new Date(year, month, 1)

  const arr: { date: number; key: string }[] = []

  // JavaScript:
  // Domingo = 0
  // Lunes   = 1
  // Martes  = 2
  // Miércoles = 3
  // Jueves  = 4
  // Viernes = 5
  // Sábado  = 6
  //
  // Nuestro calendario comienza en Lunes,
  // por lo que convertimos el índice.
  const primerDia = (date.getDay() + 6) % 7

  // Espacios antes del día 1
  for (let i = 0; i < primerDia; i++) {
    arr.push({
      date: 0,
      key: ''
    })
  }

  // Días del mes
  while (date.getMonth() === month) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`

    arr.push({
      date: date.getDate(),
      key
    })

    date.setDate(date.getDate() + 1)
  }

  return arr
}

const calendarDays = computed(() =>
  getDaysInMonth(selectedYear.value, selectedMonth.value)
)

// navegación
const nextMonth = () => {
  selectedMonth.value === 11
    ? (selectedMonth.value = 0, selectedYear.value++)
    : selectedMonth.value++
}

const prevMonth = () => {
  selectedMonth.value === 0
    ? (selectedMonth.value = 11, selectedYear.value--)
    : selectedMonth.value--
}

const isToday = (dayKey: string) => {
  if (!dayKey) return false

  const [y, m, d] = dayKey.split('-').map(Number)

  return (
    y === today.getFullYear() &&
    m - 1 === today.getMonth() &&
    d === today.getDate()
  )
}

let intervaloRiesgo: any = null
onMounted(async () => {

  await Promise.all([
    cargarEventosBackend(),
    cargarListaPacientes()
  ])

  // 🔥 validar citas vencidas
  await actualizarCitasVencidas()

  // 🔥 ENVIAR RECORDATORIOS
  //await enviarRecordatoriosAutomaticos()

   // 🔥 detectar riesgo después de cargar todo
  detectarCitasRiesgo()

   // 🔥 EJECUCIÓN AUTOMÁTICA CADA 1 MINUTO
   intervaloRiesgo = setInterval(() => {
    detectarCitasRiesgo()
  }, 60000)

})

onBeforeUnmount(() => {
  if (intervaloRiesgo) {
    clearInterval(intervaloRiesgo)
  }
})

</script>


<template>
  <div class="p-6 bg-gray-50 min-h-screen">

   <!-- HEADER -->
    <div class="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">

      <!-- WhatsApp -->
      <div class="flex items-center gap-2">
        <input type="checkbox" v-model="autoWhatsApp" />
        <label class="text-sm text-gray-600">
          Envío de whatsApp automático al guardar
        </label>
      </div>

      <!-- navegación -->
      <div class="flex items-center gap-4">
        <button @click="prevMonth">◀</button>

        <h2>
          {{ selectedYear }} · {{ selectedMonth + 1 }}
        </h2>

        <button @click="nextMonth">▶</button>
      </div>

    </div> <!-- ✅ ESTE ES EL ÚNICO CIERRE DEL HEADER -->

     <!-- ===================== -->
    <!-- 📆 CALENDARIO RESPONSIVE -->
    <!-- ===================== -->
    <div class="mt-4 overflow-x-auto">

      <div class="grid grid-cols-7 gap-3 min-w-[700px] sm:min-w-0">

        <!-- DÍAS SEMANA -->
        <div v-for="d in ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']"
            :key="d"
            class="text-xs font-semibold text-gray-500 text-center py-2">
          {{ d }}
        </div>

        <!-- ===================== -->
        <!-- 📦 DÍAS -->
        <!-- ===================== -->
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="bg-white rounded-xl shadow-sm p-2 min-h-[110px] relative transition hover:shadow-md cursor-pointer"
          :class="{
            'opacity-30 bg-gray-100': !day.date,
            'ring-2 ring-blue-300': isToday(day.key),
          }"
          @click="day.key && !isPastDay(day.key) && abrirModal(day.key)"
        >

          <!-- número -->
          <div v-if="day.date" class="text-xs font-bold text-gray-700 mb-1">
            {{ day.date }}
          </div>

          <!-- ===================== -->
          <!-- 📌 EVENTOS -->
          <!-- ===================== -->
          <div v-if="eventos[day.key]" class="space-y-1">

            <div
              v-for="(ev, i) in (eventos[day.key] || [])"
              :key="i"
              class="text-[10px] rounded-md px-2 py-1 border flex flex-col gap-1"
              :class="{
                'bg-yellow-200 border-yellow-400 text-yellow-800': calcularEstadoVisual(ev) === 'Pendiente',
                'bg-red-200 border-red-400 text-red-800': calcularEstadoVisual(ev) === 'riesgo',
                'bg-gray-300 border-gray-500 text-gray-800': calcularEstadoVisual(ev) === 'Cancelada'
              }"
            >

              <!-- tipo -->
              <div class="font-semibold truncate">
                {{ ev.tipo }}
              </div>

             <div class="text-[10px] font-bold text-blue-700">
                🕒 {{ ev.hora }}
              </div>

              <!-- estado -->
              <div
                class="font-semibold truncate"
                :class="{
                  'text-yellow-500': calcularEstadoVisual(ev) === 'Pendiente',
                  'text-red-800': calcularEstadoVisual(ev) === 'riesgo',
                  'text-gray-700': calcularEstadoVisual(ev) === 'Cancelada'
                }"
              >
                {{ calcularEstadoVisual(ev) }}
              </div>

              <!-- nombre -->
              <div class="text-gray-600 truncate">
                {{ ev.nombreCompleto }}
              </div>

              <!-- acciones -->
              <div class="flex justify-between mt-1 text-[10px] gap-1 min-w-0 flex-wrap">

                <button
                    @click.stop="eliminarEvento(day.key, i)"
                    class="text-red-700 hover:text-red-900 flex items-center gap-1 whitespace-nowrap"
                  >
                   <img
                      src="https://cdn-icons-png.flaticon.com/512/1214/1214428.png"
                      class="w-3 h-3"
                    />
                    <span class="hidden sm:inline">Eliminar</span>
                  </button>

                <button
                    v-if="ev.telefono"
                    @click.stop="enviarWhatsApp(ev, day.key)"
                    class="text-blue-600 hover:text-blue-800 flex items-center gap-1 whitespace-nowrap"
                  >
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                      class="w-3 h-3"
                    />
                    <span class="hidden sm:inline">WhatsApp</span>
                  </button>
              </div>
            </div>
          </div>

          <!-- ➕ botón agregar -->
          <button
            v-if="day.key && !isPastDay(day.key)"
            @click.stop="abrirModal(day.key)"
            class="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center shadow"
          >
            +
          </button>

        </div>

      </div>
    </div>

    <!-- ===================== -->
    <!-- 🚨 ALERTA CITAS EN RIESGO -->
    <!-- ===================== -->
    <div
      v-if="mostrarAlertaRiesgo"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >

  <div class="bg-white w-[420px] rounded-2xl shadow-lg p-5">

    <h2 class="text-lg font-bold text-red-600 mb-3">
      🚨 Citas en Riesgo
    </h2>

    <p class="text-sm text-gray-600 mb-4">
      Estas citas requieren confirmación inmediata del paciente.
    </p>

    <div class="space-y-2 max-h-60 overflow-y-auto">

      <div
        v-for="(cita, i) in citasRiesgo"
        :key="i"
        class="border rounded-lg p-2 bg-red-50"
      >

        <div class="font-semibold text-sm">
          {{ cita.nombreCompleto }}
        </div>

        <div class="text-xs text-gray-600">
          {{ formatearFecha(cita.fecha) }} :  {{ cita.hora }} - {{ cita.tipo }}
        </div>

        <div class="text-xs text-red-600 font-bold">
          Estado: {{ calcularEstadoVisual(cita) }}
        </div>

        <button
          v-if="cita.telefono"
          @click="enviarWhatsApp(cita, cita.fecha)"
          class="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded"
        >
          Confirmar por WhatsApp
        </button>

      </div>

    </div>

    <div class="flex justify-end mt-4">

      <button
        @click="mostrarAlertaRiesgo = false"
        class="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        Cerrar
      </button>

    </div>

  </div>

</div>

      <!-- ===================== -->
    <!-- 🚨 MODAL CONFIRMAR ELIMINAR -->
    <!-- ===================== -->
    <div
      v-if="mostrarConfirmacionEliminar"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >

      <div class="bg-white w-[350px] rounded-2xl shadow-xl p-6">

        <h2 class="text-xl font-bold text-gray-800 mb-3">
          ¿Eliminar cita?
        </h2>

        <p class="text-sm text-gray-500 mb-6">
          Esta acción no se puede deshacer.
        </p>

        <div class="flex justify-end gap-3">

          <!-- Cancelar -->
          <button
            @click="cancelarEliminarEvento"
            class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
          >
            Cancelar
          </button>

          <!-- Confirmar -->
          <button
            @click="confirmarEliminarEvento"
            class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Sí, eliminar
          </button>

        </div>

      </div>

    </div>  


    <!-- ===================== -->
    <!-- 🧩 MODAL CLÍNICO -->
    <!-- ===================== -->
    <div
      v-if="selectedDay"
      class="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm"
    >

      <div class="bg-white w-96 rounded-2xl shadow-lg p-5">

        <h3 class="text-lg font-semibold text-gray-800 mb-1">
          {{ editingIndex !== null ? 'Editar cita' : 'Nueva cita' }}
        </h3>

        <p class="text-xs text-gray-500 mb-4">
          Fecha: {{ selectedDay }}
        </p>

        <form @submit.prevent="guardarEvento" class="space-y-2">

         
          <div class="relative">
              <!-- INPUT BUSCADOR -->
              <input
                v-model="busquedaPaciente"
                @focus="mostrarLista = true"
                @input="filtrarPacientes"
                placeholder="Buscar paciente..."
                class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-300"
              />

            <!-- LISTA DESPLEGABLE -->
            <div
              v-if="mostrarLista && pacientesFiltrados.length"
              class="absolute z-10 bg-white border w-full mt-1 rounded-lg shadow max-h-40 overflow-y-auto"
            >
              <div
                v-for="p in pacientesFiltrados"
                :key="p.id"
                @click="seleccionarPaciente(p)"
                class="p-2 hover:bg-blue-100 cursor-pointer text-sm"
              >
                {{ p.nombreCompleto }}
              </div>
            </div>
          </div>

          <input
            v-model="cita.motivo"
            placeholder="Motivo"
            class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-300"
            required
          />

          <input
            v-model="cita.telefono"
            placeholder="Teléfono"
            class="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-300"
            required
          />

          <!-- ===================== -->
          <!-- Agregar selector visual en el modal-->
          <!-- ===================== -->
          <div>

            <!-- ===================== -->
            <!-- ⏰ HORA DE LA CITA -->
            <!-- ===================== -->
            <div>

              <label class="text-sm text-gray-600 mb-2 block font-medium">
                Hora de la cita
              </label>

              <input
                type="time"

                v-model="cita.hora"

                :min="horaMinimaDisponible"

                :max="horaMaxima"

                :step="intervaloMinutos * 60"

                class="w-full border rounded-xl p-3 text-sm shadow-sm
                      focus:ring-2 focus:ring-blue-300
                      focus:border-blue-400"

                required
              />

              <!-- INFO -->
              <div class="mt-2 text-xs text-gray-500 space-y-1">

                <p>
                  🕒 Horario disponible:
                  {{ horaMinima }} - {{ horaMaxima }}
                </p>

                <p>
                  ⏱ Intervalo:
                  {{ intervaloMinutos }} minutos
                </p>

              </div>

            </div>

            <div class="grid grid-cols-3 gap-2">

              <button
                v-for="hora in horasHabiles"
                :key="hora"
                type="button"
                :disabled="!horaDisponible(hora)"
                @click="cita.hora = hora"
                class="border rounded-lg p-2 text-sm transition font-medium"

                :class="[
                  // ✅ seleccionada
                  cita.hora === hora
                    ? 'bg-blue-600 text-white border-blue-600'
                    : '',

                  // ⛔ hora pasada
                  horaYaPaso(hora)
                    ? 'bg-red-100 text-red-400 border-red-200 cursor-not-allowed'
                    : '',

                  // ⚫ ocupada
                  !horaYaPaso(hora) && !horaDisponible(hora)
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : '',

                  // ✅ disponible
                  horaDisponible(hora)
                    ? 'hover:bg-blue-50 border-gray-300'
                    : ''
                ]"
              >
                {{ hora }}
              </button>

            </div>

            <p class="text-xs text-gray-400 mt-1">
              Gris = ocupada
            </p>
          </div>


          <div class="flex justify-end gap-2 pt-3">

            <button
              type="button"
              @click="selectedDay = null"
              class="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
            >
              Cancelar
            </button>

            <button
              type="submit"
              class="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Guardar
            </button>

          </div>

        </form>

      </div>
    </div>

  </div>
</template>
