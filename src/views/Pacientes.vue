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
const pestañaActiva = ref<
  | 'paciente'
  | 'antecedentes'
  | 'antecedentesFamiliares'
  | 'antecedentesQuirurgicos'
  | 'ginecoObstetricos'
  | 'habitos'
  | 'inmunizacion'
  | 'actividadFisica'
  | 'alergias'
  | 'medicacionActual'
  | 'hea'
  | 'examenFisico'
  | 'imc'
  | 'roas'
  | 'laboratorios'
  | 'ecg'
  | 'imagenes'
  | 'riesgoCardiovascular'
  | 'impresionDiagnostica'
  | 'planTerapeutico'
  | 'criteriosAceptacion'
>('paciente')
const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''
const rol = localStorage.getItem("rol") || ''

const API_URL = import.meta.env.VITE_API_URL

const API_URL_ListaPacientes = `${API_URL}/Pacientes/ListaPacientes/${encodeURIComponent(clinica)}`

const API_URL_ExpedienteCompleto = `${API_URL}/ExpedienteClinico/GuardarExpedienteCompleto`

const API_URL_Pacientes_Guardar = `${API_URL}/Pacientes/GuardarPacientes`

const API_URL_AntecedentesPersonales_Guardar = `${API_URL}/AntecedentesPersonales/GuardarAntecedentesPersonales`

const API_URL_AntecedentesFamiliares_Guardar = `${API_URL}/AntecedentesFamiliares/GuardarAntecedentesFamiliares`

const API_URL_AntecedentesQuirurgicos_Guardar = `${API_URL}/AntecedentesQuirurgicos/GuardarAntecedentesQuirurgicos`


const API_URL_GinecoObstetricos_Guardar = `${API_URL}/GinecoObstetricos/GuardarGinecoObstetricos`


const API_URL_Habitos_Guardar = `${API_URL}/Habitos/GuardarHabitos`

const API_URL_Inmunizacion_Guardar = `${API_URL}/Inmunizacion/GuardarInmunizacion`

const API_URL_ActividadFisica_Guardar = `${API_URL}/ActividadFisica/GuardarActividadFisica`

const API_URL_Alergias_Guardar = `${API_URL}/Alergias/GuardarAlergias`

const API_URL_Medicacion_Guardar = `${API_URL}/MedicacionActual/GuardarMedicacionActual`

const API_URL_HistoriaEnfermedadActual_Guardar = `${API_URL}/HEA/GuardarHEA`

const API_URL_ExamenFisico_Guardar = `${API_URL}/ExamenFisico/GuardarExamenFisico`

const API_URL_MC_Guardar = `${API_URL}/MC/GuardarMC`

const API_URL_ROAS_Guardar = `${API_URL}/ROAS/GuardarROAS`

const API_URL_Laboratorios_Guardar = `${API_URL}/Laboratorios/GuardarLaboratorios`

const API_URL_ECG_Guardar = `${API_URL}/ECG/GuardarECG`

const API_URL_Imagenes_Guardar = `${API_URL}/Imagenes/GuardarImagenes`

const API_URL_RiesgoCardiovascular_Guardar = `${API_URL}/RiesgoCardiovascular/GuardarRiesgoCardiovascular`

const API_URL_ImpresionDiagnostica_Guardar = `${API_URL}/ImpresionDiagnostica/GuardarImpresionDiagnostica`

const API_URL_PlanTerapeutico_Guardar = `${API_URL}/PlanTerapeutico/GuardarPlanTerapeutico`


const modoEdicion = ref(false)
const modoEdicionbtnNuevo = ref(true)

/* =========================================================
Agrega los estados para archivos
========================================================= */
interface ArchivoImagen {
  id?: number
  nombre: string
  tipo: string
  tamaño: number
  archivo?: File
  url?: string
}

const archivosImagenes = ref<ArchivoImagen[]>([])
const cargandoImagen = ref(false)


/* =========================================================
Eliminar un archivo antes de guardarlo
========================================================= */
const eliminarArchivoImagen = (index: number) => {
  archivosImagenes.value.splice(index, 1)
}

/* =========================================================
    Agrega las funciones para seleccionar y eliminar archivos
========================================================= */
const tiposImagenPermitidos = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf'
]

const seleccionarImagenes = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  const archivos = Array.from(input.files)

  for (const archivo of archivos) {
    if (!tiposImagenPermitidos.includes(archivo.type)) {
      mostrarAlerta(
        `El archivo "${archivo.name}" no es válido. Solo se permiten JPG, PNG, WEBP y PDF.`,
        'warning'
      )
      continue
    }

    const existe = archivosImagenes.value.some(
      x => x.nombre === archivo.name && x.tamaño === archivo.size
    )

    if (existe) {
      continue
    }

    archivosImagenes.value.push({
      nombre: archivo.name,
      tipo: archivo.type,
      tamaño: archivo.size,
      archivo
    })
  }

  // Permite volver a seleccionar el mismo archivo
  input.value = ''
}

/* =========================================================
Formatear tamaño
========================================================= */
const formatearTamañoArchivo = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const unidades = ['Bytes', 'KB', 'MB', 'GB']
  const indice = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / Math.pow(1024, indice)).toFixed(2)} ${unidades[indice]}`
}


/* =========================================================
Función para subir los archivos
========================================================= */
const subirArchivosImagenes = async () => {
  if (!formData.value.Id) {
    mostrarAlerta(
      'Primero debe guardar el paciente antes de adjuntar imágenes.',
      'warning'
    )
    return
  }

  const archivosPendientes = archivosImagenes.value.filter(
    archivo => archivo.archivo
  )

  if (archivosPendientes.length === 0) {
    mostrarAlerta(
      'No hay archivos nuevos para subir.',
      'warning'
    )
    return
  }

  try {
    cargandoImagen.value = true

    const datos = new FormData()

    datos.append('IdPaciente', String(formData.value.Id))
    datos.append('Clinica', clinica)

    archivosPendientes.forEach(item => {
      if (item.archivo) {
        datos.append('Archivos', item.archivo)
      }
    })

    await axios.post(
      `${API_URL}/Pacientes/SubirImagenes`,
      datos,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    mostrarAlerta(
      'Las imágenes se registraron correctamente.',
      'success'
    )

    // Quitar únicamente los archivos que ya fueron enviados
    archivosImagenes.value = archivosImagenes.value.filter(
      archivo => !archivo.archivo
    )

  } catch (error) {
    console.error('Error al subir imágenes:', error)

    mostrarAlerta(
      'Error al registrar las imágenes.',
      'error'
    )
  } finally {
    cargandoImagen.value = false
  }
}

/* =========================================================
   Nuevo Paciente
========================================================= */
const nuevoPaciente = () => {

  // Activar pestaña principal
  pestañaActiva.value = 'paciente'

  // Salir del modo edición
  modoEdicionbtnNuevo.value = true

  // Limpiar formulario
  formData.value = {
    Nombre: '',
    Apellido: '',
    FechaNacimiento: '',
    Genero: '',
    EstadoCivil: '',
    Telefono: '',
    Direccion: '',

    AntecedentesPersona: '',
    AntecedentesFamilia: '',
    AntecedentesQuirurgico: '',

    Gestaciones: 0,
    Partos: 0,
    Cesareas: 0,
    Abortos: 0,
    HijosVivos: 0,
    HijosMuertos: 0,

    DescripcionHabitos: '',
    EstadoInmunizacion: '',
    NivelActividadFisica: '',
  
    Alergia: '',
    Medicacion: '',
    HistoriaEnfermedad: '',

    PresionArterial: '',
    FrecuenciaCardiaca: null,
    FrecuenciaRespiratoria: null,
    SaturacionOxigeno: null,
    PesoExamenFisico: null,
    Temperatura: '',

    Peso: null,
    Estatura: null,

    RevisionAparatosSistemas: '',
    ResultadosLaboratorio: '',
    InterpretacionElectrocardiograma: '',
    EstudiosImagen: '',
    ResultadoEvaluacion: '',
    Diagnostica: '',
    TratamientoIndicado: ''
  }
   modoEdicion.value = false
}



/* =========================================================
   🏷️ TÍTULO DE PÁGINA
========================================================= */
const pageTitle = ref('Pacientes')


// ✅ INTERFACE CORRECTA
interface Paciente {
  id: number
  nombreCompleto: string
  Nombre: string
  Apellido: string
  fechaNacimiento: string
  genero: string
  estadoCivil: string
  fecha: string
  telefono: string
  direccion: string

  AntecedentesPersona: string
  AntecedentesFamilia: string
  AntecedentesQuirurgico: string

  Gestaciones: string
  Partos: string
  Cesareas: string
  Abortos: string
  HijosVivos: string
  HijosMuertos: string

  DescripcionHabitos: string
  EstadoInmunizacion: string
  NivelActividadFisica: string

  EstadoAlergia: string
  Alergia: string

  Medicacion: string

  HistoriaEnfermedad: string

  PresionArterial: string
  FrecuenciaCardiaca: string
  FrecuenciaRespiratoria: string
  SaturacionOxigeno: string
  PesoExamenFisico: string
  Temperatura: string

  Peso: string
  Estatura: string
  IndiceMasaCorporal: string

  RevisionAparatosSistemas: string

  ResultadosLaboratorio: string

  InterpretacionElectrocardiograma: string

  EstudiosImagen: string

  ResultadoEvaluacion: string

  Diagnostica: string

  TratamientoIndicado: string

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
  IdPaciente: 0,
  Clinica: clinica,

  Nombre: '',
  Apellido: '',
  FechaNacimiento: '',
  Telefono: '',
  Genero: '',
  EstadoCivil: '',
  Direccion: '',

  AntecedentesPersona: '',
  AntecedentesFamilia: '',
  AntecedentesQuirurgico: '',

  Gestaciones: '',
  Partos: '',
  Cesareas: '',
  Abortos: '',
  HijosVivos: '',
  HijosMuertos: '',

  DescripcionHabitos: '',
  EstadoInmunizacion: '',
  NivelActividadFisica: '',

  EstadoAlergia: '',
  Alergia: '',

  Medicacion: '',
  HistoriaEnfermedad: '',

  PresionArterial: '',
  FrecuenciaCardiaca: '',
  FrecuenciaRespiratoria: '',
  SaturacionOxigeno: '',
  PesoExamenFisico: '',
  Temperatura: '',

  Peso: '',
  Estatura: '',
  IndiceMasaCorporal: '',

  RevisionAparatosSistemas: '',

  ResultadosLaboratorio: '',

  InterpretacionElectrocardiograma: '',
  
  EstudiosImagen: '',

  ResultadoEvaluacion: '',

  Diagnostica: '',

  TratamientoIndicado: ''

})



/* Agrega el cálculo automático de edad */
const edad = computed(() => {
  if (!formData.value.FechaNacimiento) {
    return ''
  }

  const nacimiento = new Date(formData.value.FechaNacimiento)
  const hoy = new Date()

  let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear()

  const mes = hoy.getMonth() - nacimiento.getMonth()

  if (
    mes < 0 ||
    (mes === 0 && hoy.getDate() < nacimiento.getDate())
  ) {
    edadCalculada--
  }

  return edadCalculada >= 0 ? edadCalculada : ''
})

//--Crear el cálculo automático del IMC
const imc = computed(() => {
  const peso = Number(formData.value.Peso)
  const estatura = Number(formData.value.Estatura)

  if (
    !peso ||
    !estatura ||
    peso <= 0 ||
    estatura <= 0
  ) {
    return null
  }

  const resultado = peso / Math.pow(estatura, 2)

  return Number(resultado.toFixed(2))
})

const generos = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' },
  { value: 'N', label: 'Prefiero no decirlo' }
]

const estadosCiviles = [
  { value: 'SOLTERO', label: 'Soltero(a)' },
  { value: 'CASADO', label: 'Casado(a)' },
  { value: 'UNION_LIBRE', label: 'Unión libre' },
  { value: 'DIVORCIADO', label: 'Divorciado(a)' },
  { value: 'VIUDO', label: 'Viudo(a)' },
  { value: 'SEPARADO', label: 'Separado(a)' }
]

const nivelesActividadFisica = [
  { value: 'SEDENTARIO', label: 'Sedentario' },
  { value: 'LEVE', label: 'Leve' },
  { value: 'MODERADO', label: 'Moderado' },
  { value: 'INTENSO', label: 'Intenso' },
  { value: 'NO_REALIZA', label: 'No realiza actividad física' },
  { value: 'OTRO', label: 'Otro' }
]

/* =========================================================
   🌐 API - CARGA DE DATOS
   Obtener pacientes, doctores y citas desde backend
========================================================= */
// ✅ CARGA DE DATOS (CORRECTA)
const cargarPacientes = async () => {
  try {
    console.log('======================================')
    console.log('INICIANDO CARGA DE PACIENTES')
    console.log('API_URL:', API_URL)
    console.log('CLINICA:', clinica)
    console.log('ENDPOINT:', API_URL_ListaPacientes)

    const res = await axios.get(API_URL_ListaPacientes)

    console.log('STATUS:', res.status)
    console.log('RESPUESTA API:', res.data)

    const data = Array.isArray(res.data)
      ? res.data
      : []

    console.log('TOTAL RECIBIDOS:', data.length)

    pacientes.value = data.map((p: any) => ({
      id: p.id ?? p.Id ?? 0,

      idPaciente: p.idPaciente ?? p.IdPaciente ?? 0,

      nombreCompleto:
        p.nombreCompleto ??
        p.NombreCompleto ??
        '',

      nombre:
        p.nombre ??
        p.Nombre ??
        '',

      apellido:
        p.apellido ??
        p.Apellido ??
        '',

      fechaNacimiento:
        p.fechaNacimiento ??
        p.FechaNacimiento ??
        '',

      genero:
        p.genero ??
        p.Genero ??
        '',

      estadoCivil:
        p.estadoCivil ??
        p.EstadoCivil ??
        '',

      fecha:
        p.fecha ??
        p.Fecha ??
        '',

      telefono:
        p.telefono ??
        p.Telefono ??
        '',

      direccion:
        p.direccion ??
        p.Direccion ??
        '',

      antecedentesPersona:
        p.antecedentesPersona ??
        p.AntecedentesPersona ??
        '',

      antecedentesFamilia:
        p.antecedentesFamilia ??
        p.AntecedentesFamilia ??
        '',

      antecedentesQuirurgico:
        p.antecedentesQuirurgico ??
        p.AntecedentesQuirurgico ??
        '',

      gestaciones:
        p.gestaciones ??
        p.Gestaciones ??
        '',

      partos:
        p.partos ??
        p.Partos ??
        '',

      cesareas:
        p.cesareas ??
        p.Cesareas ??
        '',

      abortos:
        p.abortos ??
        p.Abortos ??
        '',

      hijosVivos:
        p.hijosVivos ??
        p.HijosVivos ??
        '',

      hijosMuertos:
        p.hijosMuertos ??
        p.HijosMuertos ??
        '',

      descripcionHabitos:
        p.descripcionHabitos ??
        p.DescripcionHabitos ??
        '',

      estadoInmunizacion:
        p.estadoInmunizacion ??
        p.EstadoInmunizacion ??
        '',

      nivelActividadFisica:
        p.nivelActividadFisica ??
        p.NivelActividadFisica ??
        '',

      estadoAlergia:
        p.estadoAlergia ??
        p.EstadoAlergia ??
        '',

      alergia:
        p.alergia ??
        p.Alergia ??
        '',

      medicacion:
        p.medicacion ??
        p.Medicacion ??
        '',

      historiaEnfermedad:
        p.historiaEnfermedad ??
        p.HistoriaEnfermedad ??
        '',

      // =========================
      // EXAMEN FÍSICO
      // =========================

      presionArterial:
        p.presionArterial ??
        p.PresionArterial ??
        '',

      frecuenciaCardiaca:
        p.frecuenciaCardiaca ??
        p.FrecuenciaCardiaca ??
        '',

      frecuenciaRespiratoria:
        p.frecuenciaRespiratoria ??
        p.FrecuenciaRespiratoria ??
        '',

      saturacionOxigeno:
        p.saturacionOxigeno ??
        p.SaturacionOxigeno ??
        '',

      PesoExamenFisico:
        p.pesoExamenFisico ??
        p.PesoExamenFisico ??
        '',

      temperatura:
        p.temperatura ??
        p.Temperatura ??
        '',

        Peso: 
         p.peso ??
         p.Peso ??
        '',

        Estatura: 
         p.estatura ??
         p.Estatura ??
        '',

        IndiceMasaCorporal: 
         p.indiceMasaCorporal ??
         p.IndiceMasaCorporal ??
        '',

        RevisionAparatosSistemas: 
         p.revisionAparatosSistemas ??
         p.RevisionAparatosSistemas ??
        '',

        ResultadosLaboratorio: 
         p.resultadosLaboratorio ??
         p.ResultadosLaboratorio ??
        '',

        InterpretacionElectrocardiograma:
         p.interpretacionElectrocardiograma ??
         p.InterpretacionElectrocardiograma ??
        '',

        EstudiosImagen:
         p.estudiosImagen ??
         p.EstudiosImagen ??
        '',

        ResultadoEvaluacion:
         p.resultadoEvaluacion ??
         p.ResultadoEvaluacion ??
        '',

        Diagnostica:
         p.diagnostica ??
         p.Diagnostica ??
        '',

        TratamientoIndicado:
         p.tratamientoIndicado ??
         p.TratamientoIndicado ??
        '',
    }))

    console.log('PACIENTES EN REACTIVO:', pacientes.value)
    console.log('TOTAL PACIENTES:', pacientes.value.length)

    // Reiniciar página si fuera necesario
    if (currentPage.value > totalPages.value) {
      currentPage.value = 1
    }

  } catch (error) {
    console.error('======================================')
    console.error('ERROR AL CARGAR PACIENTES')
    console.error(error)

    if (axios.isAxiosError(error)) {
      console.error('STATUS ERROR:', error.response?.status)
      console.error('DATA ERROR:', error.response?.data)
      console.error('URL ERROR:', error.config?.url)
    }

    pacientes.value = []

    mostrarAlerta(
      'No fue posible cargar los pacientes.',
      'error'
    )
  }
}


//RECUPERAR ID_PACIENTE
const guardarPaciente = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/GuardarPacientes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(paciente.value)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.mensaje || "Error al guardar paciente");
    }

    // =========================================
    // GUARDAR EL ID DEL PACIENTE ACTUAL
    // =========================================
    const idPaciente = data.idPaciente;

    localStorage.setItem(
      "idPaciente",
      String(idPaciente)
    );

    // También mantenerlo en el paciente
    paciente.value.Id = idPaciente;

    console.log("Paciente creado:", idPaciente);

  } catch (error) {
    console.error(error);
  }
};


 const esPacienteFemenina = computed(() => {
  const genero = String(formData.value.Genero ?? '')
    .trim()
    .toUpperCase()

  return genero === 'F' || genero === 'FEMENINO' 
})

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
formData.value = {
  Id: 0,
  Nombre: '',
  Apellido: '',
  FechaNacimiento: '',
  Telefono: '',
  Genero: '',
  EstadoCivil: '',
  Direccion: '',

  AntecedentesPersona: '',
  AntecedentesFamilia: '',
  AntecedentesQuirurgico: '',

  Gestaciones: '',
  Partos: '',
  Cesareas: '',
  Abortos: '',
  HijosVivos: '',
  HijosMuertos: '',

  DescripcionHabitos: '',
  EstadoInmunizacion: '',
  NivelActividadFisica: '',

  EstadoAlergia: '',
  Alergia: '',

  Medicacion: '',

  HistoriaEnfermedad: '',

  PresionArterial: '',
  FrecuenciaCardiaca: '',
  FrecuenciaRespiratoria: '',
  SaturacionOxigeno: '',
  PesoExamenFisico: '',
  Temperatura: '',

  Peso: '',
  Estatura: '',
  IndiceMasaCorporal: '',

  RevisionAparatosSistemas: '',

  ResultadosLaboratorio: '',

  InterpretacionElectrocardiograma: '',

  EstudiosImagen: '',

  ResultadoEvaluacion: '',

  Diagnostica: '',

  TratamientoIndicado: ''
}

pestañaActiva.value = 'paciente'


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

// =========================================================
// 🧹 RESTABLECER FORMULARIO
// =========================================================
const resetForm = () => {
  formData.value = {
    Id: 0,
    IdPaciente: 0,
    Clinica: clinica,

    Nombre: '',
    Apellido: '',
    FechaNacimiento: '',
    Telefono: '',
    Genero: '',
    EstadoCivil: '',
    Direccion: '',

    AntecedentesPersona: '',
    AntecedentesFamilia: '',
    AntecedentesQuirurgico: '',

    Gestaciones: '',
    Partos: '',
    Cesareas: '',
    Abortos: '',
    HijosVivos: '',
    HijosMuertos: '',

    DescripcionHabitos: '',
    EstadoInmunizacion: '',
    NivelActividadFisica: '',

    EstadoAlergia: '',
    Alergia: '',

    Medicacion: '',
    HistoriaEnfermedad: '',

    PresionArterial: '',
    FrecuenciaCardiaca: '',
    FrecuenciaRespiratoria: '',
    SaturacionOxigeno: '',
    PesoExamenFisico: '',
    Temperatura: '',

    TratamientoIndicado: '',

    Peso: '',
    Estatura: '',
    IndiceMasaCorporal: '',

    RevisionAparatosSistemas: '',

    ResultadosLaboratorio: '',

    InterpretacionElectrocardiograma: '',

    EstudiosImagen: '',

    ResultadoEvaluacion: '',

    Diagnostica: '',

  }

  pestañaActiva.value = 'paciente'
}


// ✅ GUARDAR
const enviarFormulario = async () => {
  try {
    // =========================================================
    // 1. DATOS GENERALES
    // =========================================================
    formData.value.Clinica = clinica
    formData.value.IndiceMasaCorporal = imc.value

    // Normalizar género una sola vez
    const genero = String(formData.value.Genero || '')
      .trim()
      .toUpperCase()

    // =========================================================
    // 2. MODO EDICIÓN
    // =========================================================
    if (modoEdicion.value) {

      await axios.put(
        `${API_URL}/Pacientes/EditarPacientes/${formData.value.Id}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/AntecedentesPersonales/EditarAntecedentesPersonales/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/AntecedentesFamiliares/EditarAntecedentesFamiliares/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/AntecedentesQuirurgicos/EditarAntecedentesQuirurgicos/${formData.value.IdPaciente}`,
        formData.value
      )

      // =======================================================
      // GINECO-OBSTÉTRICOS SOLO PARA MUJER
      // =======================================================
      if (genero === 'F' || genero === 'FEMENINO') {
        await axios.put(
          `${API_URL}/GinecoObstetricos/EditarGinecoObstetricos/${formData.value.IdPaciente}`,
          formData.value
        )
      }

      await axios.put(
        `${API_URL}/Habitos/EditarHabitos/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/Inmunizacion/EditarInmunizacion/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/ActividadFisica/EditarActividadFisica/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/Alergias/EditarAlergias/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/MedicacionActual/EditarMedicacionActual/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/HEA/EditarHistoriaEnfermedadActual/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/ExamenFisico/EditarExamenFisico/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/MC/EditarMC/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/ROAS/EditarROAS/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/Laboratorios/EditarLaboratorios/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/ECG/EditarECG/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/Imagenes/EditarImagenes/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/RiesgoCardiovascular/EditarRiesgoCardiovascular/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/ImpresionDiagnostica/EditarImpresionDiagnostica/${formData.value.IdPaciente}`,
        formData.value
      )

      await axios.put(
        `${API_URL}/PlanTerapeutico/EditarPlanTerapeutico/${formData.value.IdPaciente}`,
        formData.value
      )

      mostrarAlerta(
        "Paciente actualizado correctamente",
        "success"
      )

    } else {

      // =========================================================
      // 3. CREAR EXPEDIENTE COMPLETO
      // =========================================================

      const API_URL_ExpedienteCompleto =
        `${API_URL}/Pacientes/GuardarExpedienteCompleto`

      // ---------------------------------------------------------
      // Función auxiliar:
      // Devuelve null cuando una sección no tiene información.
      // ---------------------------------------------------------
      const tieneDatos = (obj: Record<string, any>) => {
        return Object.values(obj).some(
          valor =>
            valor !== null &&
            valor !== undefined &&
            String(valor).trim() !== ''
        )
      }

      // ---------------------------------------------------------
      // PACIENTE
      // ---------------------------------------------------------
      const paciente = {
        Nombre: formData.value.Nombre,
        Apellido: formData.value.Apellido,
        FechaNacimiento: formData.value.FechaNacimiento,
        Telefono: formData.value.Telefono,
        Genero: formData.value.Genero,
        EstadoCivil: formData.value.EstadoCivil,
        Direccion: formData.value.Direccion,
        Clinica: formData.value.Clinica
      }

      // ---------------------------------------------------------
      // ANTECEDENTES PERSONALES
      // ---------------------------------------------------------
      const antecedentesPersonales = {
        Clinica: formData.value.Clinica,
        Fecha: formData.value.Fecha,
        AntecedentesPersona:
          formData.value.AntecedentesPersona
      }

      // ---------------------------------------------------------
      // ANTECEDENTES FAMILIARES
      // ---------------------------------------------------------
      const antecedentesFamiliares = {
        Clinica: formData.value.Clinica,
        Fecha: formData.value.Fecha,
        AntecedentesFamilia:
          formData.value.AntecedentesFamilia
      }

      // ---------------------------------------------------------
      // ANTECEDENTES QUIRÚRGICOS
      // ---------------------------------------------------------
      const antecedentesQuirurgicos = {
        Clinica: formData.value.Clinica,
        Fecha: formData.value.Fecha,
        AntecedentesQuirurgico:
          formData.value.AntecedentesQuirurgico
      }

      // ---------------------------------------------------------
// GINECO-OBSTÉTRICOS
// SOLO MUJER
// ---------------------------------------------------------
const convertirEnteroONull = (valor: any): number | null => {
  if (
    valor === '' ||
    valor === null ||
    valor === undefined
  ) {
    return null
  }

  const numero = Number(valor)

  return Number.isNaN(numero) ? null : numero
}

const ginecoObstetricos =
  genero === 'F' || genero === 'FEMENINO'
    ? {
        Clinica: formData.value.Clinica,

        Gestaciones:
          convertirEnteroONull(formData.value.Gestaciones),

        Partos:
          convertirEnteroONull(formData.value.Partos),

        Cesareas:
          convertirEnteroONull(formData.value.Cesareas),

        Abortos:
          convertirEnteroONull(formData.value.Abortos),

        HijosVivos:
          convertirEnteroONull(formData.value.HijosVivos),

        HijosMuertos:
          convertirEnteroONull(formData.value.HijosMuertos)
      }
    : null

      // ---------------------------------------------------------
      // HÁBITOS
      // ---------------------------------------------------------
     const habitos = {
        Clinica: formData.value.Clinica,
        DescripcionHabitos:
          formData.value.DescripcionHabitos
      }

      // ---------------------------------------------------------
      // INMUNIZACIÓN
      // ---------------------------------------------------------
      const inmunizacion = {
        Clinica: formData.value.Clinica,
        EstadoInmunizacion:
          formData.value.EstadoInmunizacion
      }

      // ---------------------------------------------------------
      // ACTIVIDAD FÍSICA
      // ---------------------------------------------------------
      const actividadFisica = {
          Clinica: formData.value.Clinica,
          NivelActividadFisica:
            formData.value.NivelActividadFisica
        }

      // ---------------------------------------------------------
      // ALERGIAS
      // ---------------------------------------------------------
      const alergias = {
          Clinica: formData.value.Clinica,
          EstadoAlergia: formData.value.EstadoAlergia || '',
          Alergia: formData.value.Alergia || ''
        }

      // ---------------------------------------------------------
      // MEDICACIÓN ACTUAL
      // ---------------------------------------------------------
      const medicacionActual = {
          Clinica: formData.value.Clinica,

          Medicacion:
            formData.value.Medicacion
        }

      // ---------------------------------------------------------
      // HISTORIA DE ENFERMEDAD ACTUAL
      // ---------------------------------------------------------
      const historiaEnfermedadActual = {
          Clinica: formData.value.Clinica,

          HistoriaEnfermedad:
            formData.value.HistoriaEnfermedad
        }

      // ---------------------------------------------------------
      // EXAMEN FÍSICO
      // ---------------------------------------------------------
     const examenFisico = {
      Clinica: formData.value.Clinica,
      PresionArterial: formData.value.PresionArterial || null,
      FrecuenciaCardiaca:
        formData.value.FrecuenciaCardiaca !== '' &&
        formData.value.FrecuenciaCardiaca !== null &&
        formData.value.FrecuenciaCardiaca !== undefined
          ? Number(formData.value.FrecuenciaCardiaca)
          : null,

      FrecuenciaRespiratoria:
        formData.value.FrecuenciaRespiratoria !== '' &&
        formData.value.FrecuenciaRespiratoria !== null &&
        formData.value.FrecuenciaRespiratoria !== undefined
          ? Number(formData.value.FrecuenciaRespiratoria)
          : null,

      SaturacionOxigeno:
        formData.value.SaturacionOxigeno !== '' &&
        formData.value.SaturacionOxigeno !== null &&
        formData.value.SaturacionOxigeno !== undefined
          ? Number(formData.value.SaturacionOxigeno)
          : null,

      Peso:
        formData.value.PesoExamenFisico !== '' &&
        formData.value.PesoExamenFisico !== null &&
        formData.value.PesoExamenFisico !== undefined
          ? Number(formData.value.PesoExamenFisico)
          : null,

      Temperatura:
        formData.value.Temperatura !== '' &&
        formData.value.Temperatura !== null &&
        formData.value.Temperatura !== undefined
          ? Number(formData.value.Temperatura)
          : null
    }

      // ---------------------------------------------------------
      // MC
      // ---------------------------------------------------------
     const mc = {
        Clinica: formData.value.Clinica,

        Peso:
          formData.value.Peso !== '' &&
          formData.value.Peso !== null &&
          formData.value.Peso !== undefined
            ? Number(formData.value.Peso)
            : null,

        Estatura:
          formData.value.Estatura !== '' &&
          formData.value.Estatura !== null &&
          formData.value.Estatura !== undefined
            ? Number(formData.value.Estatura)
            : null,

        IndiceMasaCorporal:
          imc.value !== null &&
          imc.value !== undefined &&
          imc.value !== ''
            ? Number(imc.value)
            : null
      }

      // ---------------------------------------------------------
      // ROAS
      // ---------------------------------------------------------
      const roas = {
            Clinica: formData.value.Clinica,

            RevisionAparatosSistemas:
              formData.value.RevisionAparatosSistemas
          }

      // ---------------------------------------------------------
      // LABORATORIOS
      // ---------------------------------------------------------
     const laboratorios = {
          Clinica: formData.value.Clinica,

          ResultadosLaboratorio:
            formData.value.ResultadosLaboratorio
        }

      // ---------------------------------------------------------
      // ECG
      // ---------------------------------------------------------
     const ecg = {
          Clinica: formData.value.Clinica,

          InterpretacionElectrocardiograma:
            formData.value.InterpretacionElectrocardiograma
        }

      // ---------------------------------------------------------
      // IMÁGENES
      // ---------------------------------------------------------
      const imagenes = {
          Clinica: formData.value.Clinica,

          EstudiosImagen:
            formData.value.EstudiosImagen
        }

      // ---------------------------------------------------------
      // RIESGO CARDIOVASCULAR
      // ---------------------------------------------------------
      const riesgoCardiovascular = {
            Clinica: formData.value.Clinica,

            ResultadoEvaluacion:
              formData.value.ResultadoEvaluacion
          }

      // ---------------------------------------------------------
      // IMPRESIÓN DIAGNÓSTICA
      // ---------------------------------------------------------
     const impresionDiagnostica = {
          Clinica: formData.value.Clinica,

          Diagnostica:
            formData.value.Diagnostica
        }

      // ---------------------------------------------------------
      // PLAN TERAPÉUTICO
      // ---------------------------------------------------------
      const planTerapeutico = {
          Clinica: formData.value.Clinica,

          TratamientoIndicado:
            formData.value.TratamientoIndicado
        }

      // =========================================================
      // 4. CONSTRUIR PAYLOAD
      // =========================================================
      const payload = {
        Paciente: paciente,

        AntecedentesPersonales:
          tieneDatos(antecedentesPersonales)
            ? antecedentesPersonales
            : null,

        AntecedentesFamiliares:
          tieneDatos(antecedentesFamiliares)
            ? antecedentesFamiliares
            : null,

        AntecedentesQuirurgicos:
          tieneDatos(antecedentesQuirurgicos)
            ? antecedentesQuirurgicos
            : null,

        GinecoObstetricos:
          ginecoObstetricos &&
          tieneDatos(ginecoObstetricos)
            ? ginecoObstetricos
            : null,

        Habitos:
          tieneDatos(habitos)
            ? habitos
            : null,

        Inmunizacion:
          tieneDatos(inmunizacion)
            ? inmunizacion
            : null,

        ActividadFisica:
          tieneDatos(actividadFisica)
            ? actividadFisica
            : null,

        Alergias:
          tieneDatos(alergias)
            ? alergias
            : null,

        MedicacionActual:
          tieneDatos(medicacionActual)
            ? medicacionActual
            : null,

        HistoriaEnfermedadActual:
          tieneDatos(historiaEnfermedadActual)
            ? historiaEnfermedadActual
            : null,

        ExamenFisico:
          tieneDatos(examenFisico)
            ? examenFisico
            : null,

        MC:
          tieneDatos(mc)
            ? mc
            : null,

        ROAS:
          tieneDatos(roas)
            ? roas
            : null,

        Laboratorios:
          tieneDatos(laboratorios)
            ? laboratorios
            : null,

        ECG:
          tieneDatos(ecg)
            ? ecg
            : null,

        Imagenes:
          tieneDatos(imagenes)
            ? imagenes
            : null,

        RiesgoCardiovascular:
          tieneDatos(riesgoCardiovascular)
            ? riesgoCardiovascular
            : null,

        ImpresionDiagnostica:
          tieneDatos(impresionDiagnostica)
            ? impresionDiagnostica
            : null,

        PlanTerapeutico:
          tieneDatos(planTerapeutico)
            ? planTerapeutico
            : null
      }

      console.log(
        "PAYLOAD EXPEDIENTE COMPLETO:",
        payload
      )

      // =========================================================
      // 5. GUARDAR TODO EL EXPEDIENTE
      // =========================================================
      const response = await axios.post(
        API_URL_ExpedienteCompleto,
        payload
      )

      console.log(
        "RESPUESTA EXPEDIENTE:",
        response.data
      )

      // =========================================================
      // 6. RECUPERAR IdPaciente
      // =========================================================
      const idPaciente =
        response.data?.idPaciente ??
        response.data?.IdPaciente ??
        response.data?.paciente?.id ??
        response.data?.paciente?.Id ??
        response.data?.id ??
        response.data?.Id ??
        0

      console.log(
        "ID PACIENTE GENERADO:",
        idPaciente
      )

      // =========================================================
      // 7. VALIDAR ID
      // =========================================================
      if (!idPaciente || Number(idPaciente) <= 0) {
        throw new Error(
          "El expediente fue guardado, pero no se recibió un IdPaciente válido."
        )
      }

      // =========================================================
      // 8. GUARDAR ID EN EL FORMULARIO
      // =========================================================
      formData.value.Id = Number(idPaciente)
      formData.value.IdPaciente = Number(idPaciente)

      localStorage.setItem(
        "idPaciente",
        String(idPaciente)
      )

      console.log(
        "formData.Id:",
        formData.value.Id
      )

      console.log(
        "formData.IdPaciente:",
        formData.value.IdPaciente
      )

      // =========================================================
      // 9. GUARDAR IMÁGENES / ARCHIVOS
      // =========================================================
      // Se mantiene separado porque requiere multipart/form-data.
      if (typeof subirArchivosImagenes === 'function') {
        await subirArchivosImagenes()
      }

      mostrarAlerta(
        "Paciente creado correctamente",
        "success"
      )
    }

    // =========================================================
    // 10. LIMPIAR FORMULARIO
    // =========================================================
    resetForm()

    modoEdicion.value = false
    modoEdicionbtnNuevo.value = true

    await cargarPacientes()

  } catch (error: any) {

    console.error(
      "Error al guardar paciente:",
      error
    )

    // =========================================================
    // MOSTRAR MENSAJE REAL DEL BACKEND
    // =========================================================
    const mensaje =
      error?.response?.data?.mensaje ||
      error?.response?.data?.title ||
      error?.response?.data?.message ||
      error?.response?.data ||
      error?.message ||
      "Error al guardar paciente"

    mostrarAlerta(
      String(mensaje),
      "error"
    )
  }
}



// ✅ EDITAR PACIENTE
const editarCita = (paciente: any) => {
  console.log('Paciente seleccionado para modificar:', paciente)

  const partes = String(paciente.nombreCompleto || '')
    .trim()
    .split(/\s+/)

  let nombre = ''
  let apellido = ''

  if (partes.length === 1) {
    nombre = partes[0]
  } else if (partes.length === 2) {
    nombre = partes[0]
    apellido = partes[1]
  } else {
    nombre = partes.slice(0, 2).join(' ')
    apellido = partes.slice(2).join(' ')

  }

  formData.value = {
    Id: paciente.id ?? 0,
    IdPaciente: paciente.id?? 0,
    Nombre: paciente.nombre ?? Nombre ?? '', 
    Apellido: paciente.apellido ?? Apellido ?? '', 
    FechaNacimiento: paciente.fechaNacimiento
      ? String(paciente.fechaNacimiento).substring(0, 10)
      : '',
    Telefono: paciente.telefono ?? '',
    Genero: paciente.genero ?? '',
    EstadoCivil: paciente.estadoCivil ?? '',
    Direccion: paciente.direccion ?? '',
    AntecedentesPersona: paciente.antecedentesPersona || '',
    AntecedentesFamilia: paciente.antecedentesFamilia || '',
    AntecedentesQuirurgico: paciente.antecedentesQuirurgico || '',

    Gestaciones: paciente.gestaciones ?? '',
    Partos: paciente.partos ?? '',
    Cesareas: paciente.cesareas ?? '',
    Abortos: paciente.abortos ?? '',
    HijosVivos: paciente.hijosVivos ?? '',
    HijosMuertos: paciente.hijosMuertos ?? '',

    DescripcionHabitos: paciente.descripcionHabitos ?? '',
    EstadoInmunizacion: paciente.estadoInmunizacion ?? '',
    NivelActividadFisica: paciente.nivelActividadFisica ?? '',

    EstadoAlergia: paciente.estadoAlergia ?? '',
    Alergia: paciente.alergia ?? '',

    Medicacion: paciente.medicacion ?? '',

    HistoriaEnfermedad: paciente.historiaEnfermedad ?? paciente.HistoriaEnfermedad ?? '',

    PresionArterial: paciente.presionArterial ?? paciente.PresionArterial ?? '', 
    FrecuenciaCardiaca: paciente.frecuenciaCardiaca ?? paciente.FrecuenciaCardiaca ?? '', 
    FrecuenciaRespiratoria: paciente.frecuenciaRespiratoria ?? paciente.FrecuenciaRespiratoria ?? '', 
    SaturacionOxigeno: paciente.saturacionOxigeno ?? paciente.SaturacionOxigeno ?? '', 
    PesoExamenFisico: paciente.pesoExamenFisico ?? paciente.PesoExamenFisico ?? '', 
    Temperatura: paciente.temperatura ?? paciente.Temperatura ?? '',
    Peso: paciente.peso ?? paciente.Peso ?? '',
    Estatura: paciente.estatura ?? paciente.Estatura ?? '',
    IndiceMasaCorporal: paciente.indiceMasaCorporal ?? paciente.IndiceMasaCorporal ?? '',

    RevisionAparatosSistemas: paciente.revisionAparatosSistemas ?? paciente.RevisionAparatosSistemas ?? '',

    ResultadosLaboratorio: paciente.resultadosLaboratorio ?? paciente.ResultadosLaboratorio ?? '',

    InterpretacionElectrocardiograma: paciente.interpretacionElectrocardiograma ?? paciente.InterpretacionElectrocardiograma ?? '',

    EstudiosImagen: paciente.estudiosImagen ?? paciente.EstudiosImagen ?? '',

    ResultadoEvaluacion: paciente.resultadoEvaluacion ?? paciente.ResultadoEvaluacion ?? '',

    Diagnostica: paciente.diagnostica ?? paciente.Diagnostica ?? '',

    TratamientoIndicado: paciente.tratamientoIndicado ?? paciente.TratamientoIndicado ?? ''

  }

  console.log('Datos cargados para modificar:', formData.value)

  pestañaActiva.value = 'paciente'
  modoEdicion.value = true
  modoEdicionbtnNuevo.value = false
}


// =========================================================
// 📝 ANTECEDENTES PERSONALES
// =========================================================
const antecedentesPersonales = ref({
  AntecedentesPersona: ''
})
const guardandoAntecedentesPersonales = ref(false)

// =========================================================
// 📝 ANTECEDENTES Familia
// =========================================================
const antecedentesFamiliares = ref({
  antecedentesFamilia: ''
})
const guardandoAntecedentesFamiliares = ref(false)

// =========================================================
// 📝 ANTECEDENTES Quirurgicos
// =========================================================
const antecedentesQuirurgicos = ref({
  antecedentesQuirurgico: ''
})
const guardandoAntecedentesQuirurgicos = ref(false)



// ✅ ELIMINAR
const eliminarCita = (id: number) => {
  abrirConfirmacionEliminar(id)
}

// ✅ MOUNT
onMounted(() => {
  cargarPacientes()
})


</script>

<template #actions>
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

      <!-- =============================== -->
      <!-- FORMULARIO DEL PACIENTE -->
      <!-- =============================== -->

      
      <DefaultCard cardTitle="Datos de Identificación del Paciente">
        <!-- =============================== -->
        <!-- PESTAÑAS -->
        <!-- =============================== -->

        <div class="border-b border-gray-200 px-6 pt-4">

          <nav
            class="flex flex-wrap gap-2"
            aria-label="Pestañas"
          >

            <!-- PESTAÑA PACIENTE -->
            <button
              type="button"
              @click="pestañaActiva = 'paciente'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'paciente'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              👤 Paciente
            </button>


            <!-- PESTAÑA ANTECEDENTES -->
            <button
              type="button"
              @click="pestañaActiva = 'antecedentes'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'antecedentes'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🩺 Antecedentes Personales
            </button>


            <!-- PESTAÑA ANTECEDENTES FAMILIARES -->
            <button
              type="button"
              @click="pestañaActiva = 'antecedentesFamiliares'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'antecedentesFamiliares'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              👨‍👩‍👧‍👦 Antecedentes Familiares
            </button>


            <!-- PESTAÑA ANTECEDENTES QUIRÚRGICOS -->
            <button
              type="button"
              @click="pestañaActiva = 'antecedentesQuirurgicos'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'antecedentesQuirurgicos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🏥 Antecedentes Quirúrgicos
            </button>


            <!-- PESTAÑA GINECO-OBSTÉTRICOS -->
            <button
              v-if="esPacienteFemenina"
              type="button"
              @click="pestañaActiva = 'ginecoObstetricos'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'ginecoObstetricos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🤰 Gineco-Obstétricos
            </button>


            <!-- PESTAÑA HÁBITOS -->
            <button
              type="button"
              @click="pestañaActiva = 'habitos'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'habitos'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🚬 Hábitos
            </button>


            <!-- PESTAÑA INMUNIZACIÓN -->
            <button
              type="button"
              @click="pestañaActiva = 'inmunizacion'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'inmunizacion'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              💉 Inmunización
            </button>


            <!-- PESTAÑA ACTIVIDAD FÍSICA -->
            <button
              type="button"
              @click="pestañaActiva = 'actividadFisica'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'actividadFisica'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🏃 Actividad Física
            </button>


            <!-- PESTAÑA ALERGIAS -->
            <button
              type="button"
              @click="pestañaActiva = 'alergias'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'alergias'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              ⚠️ Alergias
            </button>


            <!-- PESTAÑA MEDICACIÓN ACTUAL -->
            <button
              type="button"
              @click="pestañaActiva = 'medicacionActual'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'medicacionActual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              💊 Medicación Actual
            </button>


            <!-- PESTAÑA HEA -->
            <button
              type="button"
              @click="pestañaActiva = 'hea'"
              :class="[
                'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                pestañaActiva === 'hea'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🩺 HEA
            </button>


            <!-- PESTAÑA EXAMEN FÍSICO -->
            <button
              type="button"
              @click="pestañaActiva = 'examenFisico'"
              :class="[
                'px-6 py-3 text-sm font-semibold rounded-t-lg transition shrink-0',
                pestañaActiva === 'examenFisico'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              ]"
            >
              🩺 Examen Físico
            </button>

            <!-- PESTAÑA IMC -->
              <button
                type="button"
                @click="pestañaActiva = 'imc'"
                :class="[
                  'px-6 py-3 text-sm font-semibold rounded-t-lg transition shrink-0',
                  pestañaActiva === 'imc'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                ⚖️ IMC
              </button>


              <button
                type="button"
                @click="pestañaActiva = 'roas'"
                :class="[
                  'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                  pestañaActiva === 'roas'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                🩺 ROAS
              </button>


              <button
                type="button"
                @click="pestañaActiva = 'laboratorios'"
                :class="[
                  'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                  pestañaActiva === 'laboratorios'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                🧪 Laboratorios
              </button>


              <button
                type="button"
                @click="pestañaActiva = 'ecg'"
                :class="[
                  'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                  pestañaActiva === 'ecg'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                ❤️ ECG
              </button>


              <button
                  type="button"
                  @click="pestañaActiva = 'imagenes'"
                  :class="[
                    'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                    pestañaActiva === 'imagenes'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  ]"
                >
                  🖼️ Imágenes
                </button>


              <button
                type="button"
                @click="pestañaActiva = 'riesgoCardiovascular'"
                :class="[
                  'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                  pestañaActiva === 'riesgoCardiovascular'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                ❤️ Riesgo Cardiovascular
              </button>


              <button
                type="button"
                @click="pestañaActiva = 'impresionDiagnostica'"
                :class="[
                  'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                  pestañaActiva === 'impresionDiagnostica'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                ]"
              >
                🩺 Impresión Diagnóstica
              </button>


              <button
                  type="button"
                  @click="pestañaActiva = 'planTerapeutico'"
                  :class="[
                    'px-5 py-3 text-sm font-semibold rounded-t-lg transition whitespace-nowrap',
                    pestañaActiva === 'planTerapeutico'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  ]"
                >
                  💊 Plan Terapéutico
                </button>

          </nav>

        </div>


        <!-- =============================== -->
        <!-- PESTAÑA: PACIENTE -->
        <!-- =============================== -->

        <form @submit.prevent="enviarFormulario">

          <div
            v-if="pestañaActiva === 'paciente'"
            class="p-6.5 space-y-6"
          >

            <!-- Nombre y Apellido -->
            <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">

              <!-- Nombre -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="font-medium text-gray-700">
                  Nombre
                </label>

                <input
                  type="text"
                  v-model="formData.Nombre"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

              <!-- Apellido -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="font-medium text-gray-700">
                  Apellido
                </label>

                <input
                  type="text"
                  v-model="formData.Apellido"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

            </div>


            <!-- Fecha nacimiento / Edad / Teléfono -->
            <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">

              <!-- Fecha nacimiento -->
              <div class="flex flex-col w-full xl:w-1/3 gap-2">
                <label class="font-medium text-gray-700">
                  Fecha de Nacimiento
                </label>

                <input
                  type="date"
                  v-model="formData.FechaNacimiento"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

              <!-- Edad -->
              <div class="flex flex-col w-full xl:w-1/3 gap-2">
                <label class="font-medium text-gray-700">
                  Edad
                </label>

                <input
                  type="text"
                  :value="edad !== '' ? `${edad} años` : ''"
                  class="w-full border py-3 px-5 rounded bg-gray-100 text-gray-700"
                  readonly
                  placeholder="Se calcula automáticamente"
                />
              </div>

              <!-- Teléfono -->
              <div class="flex flex-col w-full xl:w-1/3 gap-2">
                <label class="font-medium text-gray-700">
                  Teléfono
                </label>

                <input
                  v-model="telefonoFormateado"
                  type="tel"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="504 9999-9999"
                />
              </div>

            </div>


            <!-- Género / Estado Civil -->
            <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">

              <!-- Género -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">

                <label class="font-medium text-gray-700">
                  Género
                </label>

                <select
                  v-model="formData.Genero"
                  class="w-full border py-3 px-5 rounded bg-white"
                  required
                >

                  <option value="" disabled>
                    Seleccione un género
                  </option>

                  <option
                    v-for="genero in generos"
                    :key="genero.value"
                    :value="genero.value"
                  >
                    {{ genero.label }}
                  </option>

                </select>

              </div>


              <!-- Estado civil -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">

                <label class="font-medium text-gray-700">
                  Estado Civil
                </label>

                <select
                  v-model="formData.EstadoCivil"
                  class="w-full border py-3 px-5 rounded bg-white"
                  required
                >

                  <option value="" disabled>
                    Seleccione estado civil
                  </option>

                  <option
                    v-for="estado in estadosCiviles"
                    :key="estado.value"
                    :value="estado.value"
                  >
                    {{ estado.label }}
                  </option>

                </select>

              </div>

            </div>


            <!-- Dirección -->
            <div class="flex flex-col gap-2">

              <label class="font-medium text-gray-700">
                Dirección
              </label>

              <input
                type="text"
                v-model="formData.Direccion"
                class="w-full border py-3 px-5 rounded"
                required
              />

            </div>

            <!-- BOTÓN NUEVO -->
            <button
              v-if="!modoEdicionbtnNuevo"
              type="button"
              @click="nuevoPaciente"
              class="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <span class="text-lg">＋</span>
              Nuevo paciente
            </button>

          </div>

            
          <!-- =============================== -->
          <!-- PESTAÑA: ANTECEDENTES PERSONALES -->
          <!-- =============================== -->
          

          <div
            v-if="pestañaActiva === 'antecedentes'"
            class="p-6.5 space-y-6"
          >

            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Antecedentes Personales
              </h3>

              <p class="text-sm text-gray-500">
                Registre los antecedentes médicos relevantes del paciente.
              </p>
            </div>


            <!-- Descripcion Antecedentes Personales  -->
            <div class="flex flex-col gap-2">

              <label class="font-medium text-gray-700">
                Antecedentes Personales 
              </label>

              <textarea
                v-model="formData.AntecedentesPersona"
                rows="4"
                class="w-full border py-3 px-5 rounded"
                placeholder="Describa Antecedentes Personales, diagnósticos relevantes, etc."
              ></textarea>

            </div>

            <p class="text-sm text-gray-500">
                Registre antecedentes personales relevantes para la historia clínica
                del paciente.
              </p>

             <div class="rounded-lg border bg-gray-50 p-4">

              <p class="font-medium text-gray-700 mb-2">
                Antecedentes a considerar
              </p>

              <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Hipertensión</li>
                <li>Diabetes</li>
                <li>Cardiopatías</li>
                <li>Cáncer</li>
                <li>Enfermedades hereditarias</li>
                <li>Otros</li>
              </ul>

            </div>
           

          </div>

          <!-- =============================== -->
          <!-- PESTAÑA: ANTECEDENTES FAMILIARES -->
          <!-- =============================== -->

          <div
            v-if="pestañaActiva === 'antecedentesFamiliares'"
            class="p-6.5 space-y-6"
          >

            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Antecedentes Familiares
              </h3>

              <p class="text-sm text-gray-500">
                Registre antecedentes familiares relevantes para la historia clínica
                del paciente.
              </p>
            </div>


            <!-- ANTECEDENTES FAMILIARES -->
            <div class="flex flex-col gap-2">

              <label class="font-medium text-gray-700">
                Antecedentes Familiares
              </label>

              <textarea
                v-model="formData.AntecedentesFamilia"
                rows="10"
                class="w-full border py-3 px-5 rounded"
                placeholder="Registre antecedentes familiares relevantes, por ejemplo: hipertensión, diabetes, cardiopatías, cáncer, enfermedades hereditarias u otros."
              ></textarea>

              <p class="text-sm text-gray-500">
                Puede registrar información sobre familiares y enfermedades relevantes,
                incluyendo hipertensión, diabetes, cardiopatías, cáncer,
                enfermedades hereditarias y otros antecedentes.
              </p>

            </div>


            <!-- REFERENCIA DE ANTECEDENTES -->
            <div class="rounded-lg border bg-gray-50 p-4">

              <p class="font-medium text-gray-700 mb-2">
                Antecedentes a considerar
              </p>

              <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Hipertensión</li>
                <li>Diabetes</li>
                <li>Cardiopatías</li>
                <li>Cáncer</li>
                <li>Enfermedades hereditarias</li>
                <li>Otros</li>
              </ul>

            </div>


            

          </div>

          <!-- =============================== -->
          <!-- PESTAÑA: ANTECEDENTES QUIRÚRGICOS -->
          <!-- =============================== -->

          <div
            v-if="pestañaActiva === 'antecedentesQuirurgicos'"
            class="p-6.5 space-y-6"
          >

            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Antecedentes Quirúrgicos
              </h3>

              <p class="text-sm text-gray-500">
                Registre las cirugías previas y cualquier información relevante
                relacionada con procedimientos quirúrgicos.
              </p>
            </div>


            <!-- ANTECEDENTES QUIRÚRGICOS -->
            <div class="flex flex-col gap-2">

              <label class="font-medium text-gray-700">
                Antecedentes Quirúrgicos
              </label>

              <textarea
                v-model="formData.AntecedentesQuirurgico"
                rows="10"
                class="w-full border py-3 px-5 rounded"
                placeholder="Registre las cirugías previas, año, tipo de cirugía y observaciones."
              ></textarea>

            </div>


            <!-- REFERENCIA -->
            <div class="rounded-lg border bg-gray-50 p-4">

              <p class="font-medium text-gray-700 mb-2">
                Información a registrar
              </p>

              <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Cirugías previas</li>
                <li>Año</li>
                <li>Tipo de cirugía</li>
                <li>Observaciones</li>
              </ul>

            </div>
          

          </div>

          <!-- =============================== -->
          <!-- PESTAÑA: ANTECEDENTES GINECO-OBSTÉTRICOS -->
          <!-- =============================== -->

          <div
              v-if="
                pestañaActiva === 'ginecoObstetricos' &&
                esPacienteFemenina
              "
              class="p-6.5 space-y-6"
            >

            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Antecedentes Gineco-Obstétricos
              </h3>

              <p class="text-sm text-gray-500">
                Registre los antecedentes gineco-obstétricos de la paciente.
              </p>
            </div>


            <!-- G / P / C -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">

              <!-- GESTACIONES -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  G - Gestaciones
                </label>

                <input
                  v-model.number="formData.Gestaciones"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de gestaciones"
                />
              </div>


              <!-- PARTOS -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  P - Partos
                </label>

                <input
                  v-model.number="formData.Partos"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de partos"
                />
              </div>


              <!-- CESÁREAS -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  C - Cesáreas
                </label>

                <input
                  v-model.number="formData.Cesareas"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de cesáreas"
                />
              </div>

            </div>


            <!-- A / HV / HM -->
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">

              <!-- ABORTOS -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  A - Abortos
                </label>

                <input
                  v-model.number="formData.Abortos"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de abortos"
                />
              </div>


              <!-- HIJOS VIVOS -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  HV - Hijos vivos
                </label>

                <input
                  v-model.number="formData.HijosVivos"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de hijos vivos"
                />
              </div>


              <!-- HIJOS MUERTOS -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  HM - Hijos muertos
                </label>

                <input
                  v-model.number="formData.HijosMuertos"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Número de hijos muertos"
                />
              </div>

            </div>


            <!-- REFERENCIA -->
            <div class="rounded-lg border bg-gray-50 p-4">

              <p class="font-medium text-gray-700 mb-2">
                Información registrada
              </p>

              <div class="grid grid-cols-2 gap-3 text-sm text-gray-600 md:grid-cols-3">

                <div>
                  <strong>G:</strong>
                  Gestaciones
                </div>

                <div>
                  <strong>P:</strong>
                  Partos
                </div>

                <div>
                  <strong>C:</strong>
                  Cesáreas
                </div>

                <div>
                  <strong>A:</strong>
                  Abortos
                </div>

                <div>
                  <strong>HV:</strong>
                  Hijos vivos
                </div>

                <div>
                  <strong>HM:</strong>
                  Hijos muertos
                </div>

              </div>

            </div>


            <!-- BOTÓN GUARDAR 
            <div class="flex justify-start">

              <button
                type="submit"
                class="rounded p-3 bg-primary text-white"
              >
                Guardar Antecedentes Gineco-Obstétricos
              </button>  

            </div> -->

          </div>


          <div
            v-if="pestañaActiva === 'habitos'"
            class="p-6.5 space-y-6"
          >
            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Hábitos
              </h3>

              <p class="text-sm text-gray-500">
                Registre los hábitos relevantes del paciente.
              </p>
            </div>

            <div class="flex flex-col gap-2">
              <label class="font-medium text-gray-700">
                Hábitos del paciente
              </label>

              <textarea
                v-model="formData.DescripcionHabitos"
                rows="10"
                class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Registre los hábitos del paciente..."
              ></textarea>
            </div>

            <div class="rounded-lg border bg-gray-50 p-4">
              <p class="font-medium text-gray-700 mb-3">
                Información a considerar
              </p>

              <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Tabaquismo</li>
                <li>Alcohol</li>
                <li>Drogas</li>
                <li>Consumo de café</li>
                <li>Otros hábitos relevantes</li>
              </ul>
            </div>

           
          </div>

          <div
              v-if="pestañaActiva === 'inmunizacion'"
              class="p-6.5 space-y-6"
            >
              <div class="border-b pb-3">
                <h3 class="text-lg font-semibold text-gray-800">
                  Inmunización
                </h3>

                <p class="text-sm text-gray-500">
                  Registre el estado de inmunización y antecedentes de vacunación del paciente.
                </p>
              </div>

              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  Estado de inmunización
                </label>

                <textarea
                  v-model="formData.EstadoInmunizacion"
                  rows="10"
                  class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registre el estado de inmunización del paciente..."
                ></textarea>
              </div>

              <div class="rounded-lg border bg-gray-50 p-4">
                <p class="font-medium text-gray-700 mb-3">
                  Información a considerar
                </p>

                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Vacunas recibidas</li>
                  <li>Vacunas pendientes</li>
                  <li>Esquema de vacunación</li>
                  <li>Fechas relevantes de vacunación</li>
                  <li>Reacciones o antecedentes relacionados con vacunas</li>
                  <li>Otros datos de inmunización relevantes</li>
                </ul>
              </div>

             
            </div>



            <div
              v-if="pestañaActiva === 'actividadFisica'"
              class="p-6.5 space-y-6"
            >
              <div class="border-b pb-3">
                <h3 class="text-lg font-semibold text-gray-800">
                  Actividad Física
                </h3>

                <p class="text-sm text-gray-500">
                  Registre el nivel de actividad física habitual del paciente.
                </p>
              </div>

              <!-- Nivel de actividad física -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  Nivel de actividad física
                </label>

                <select
                  v-model="formData.NivelActividadFisica"
                  class="w-full border py-3 px-5 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    Seleccione un nivel
                  </option>

                  <option
                    v-for="nivel in nivelesActividadFisica"
                    :key="nivel.value"
                    :value="nivel.value"
                  >
                    {{ nivel.label }}
                  </option>
                </select>
              </div>

              <!-- Observaciones cuando selecciona Otro -->
              <div
                v-if="formData.NivelActividadFisica === 'OTRO'"
                class="flex flex-col gap-2"
              >
                <label class="font-medium text-gray-700">
                  Observaciones
                </label>

                <textarea
                  v-model="formData.NivelActividadFisica" 
                  rows="5"
                  class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describa el tipo de actividad física que realiza el paciente..."
                ></textarea>
              </div>

              <!-- Información -->
              <div class="rounded-lg border bg-gray-50 p-4">
                <p class="font-medium text-gray-700 mb-3">
                  Niveles de actividad física
                </p>

                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Sedentario</li>
                  <li>Leve</li>
                  <li>Moderado</li>
                  <li>Intenso</li>
                  <li>No realiza actividad física</li>
                  <li>Otro</li>
                </ul>
              </div>

          
            </div>


            <div
              v-if="pestañaActiva === 'alergias'"
              class="p-6.5 space-y-6"
            >
              <div class="border-b pb-3">
                <h3 class="text-lg font-semibold text-gray-800">
                  Alergias
                </h3>

                <p class="text-sm text-gray-500">
                  Registre las alergias conocidas del paciente.
                </p>
              </div>

              <!-- Sin alergias conocidas -->
              <div class="flex items-center gap-3">
                <input
                    id="estadoAlergia"
                    type="checkbox"
                    :true-value="'SI'"
                    :false-value="'NO'"
                    v-model="formData.EstadoAlergia"
                    class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />

                  <label for="estadoAlergia">
                    Sin alergias conocidas
                  </label>
              </div>

              <!-- Detalle de alergias -->
              <div
                v-if="!formData.EstadoAlergia"
                class="flex flex-col gap-2"
              >
                <label class="font-medium text-gray-700">
                  Alergias conocidas
                </label>

                <textarea
                  v-model="formData.Alergia"
                  rows="10"
                  class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registre las alergias conocidas del paciente..."
                ></textarea>
              </div>

              <!-- Información a considerar -->
              <div class="rounded-lg border bg-gray-50 p-4">
                <p class="font-medium text-gray-700 mb-3">
                  Información a considerar
                </p>

                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Medicamentos</li>
                  <li>Alimentos</li>
                  <li>Sustancias</li>
                  <li>Otros</li>
                </ul>
              </div>

              
            </div>


            <div
            v-if="pestañaActiva === 'medicacionActual'"
            class="p-6.5 space-y-6"
          >
            <div class="border-b pb-3">
              <h3 class="text-lg font-semibold text-gray-800">
                Medicación Actual
              </h3>

              <p class="text-sm text-gray-500">
                Registre los medicamentos que actualmente consume el paciente.
              </p>
            </div>

            <!-- Medicación actual -->
            <div class="flex flex-col gap-2">
              <label class="font-medium text-gray-700">
                Medicación actual
              </label>

              <textarea
                v-model="formData.Medicacion"
                rows="10"
                class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Registre los medicamentos que actualmente consume el paciente..."
              ></textarea>
            </div>

            <!-- Información a considerar -->
            <div class="rounded-lg border bg-gray-50 p-4">
              <p class="font-medium text-gray-700 mb-3">
                Información a registrar
              </p>

              <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Medicamento</li>
                <li>Dosis</li>
                <li>Frecuencia</li>
                <li>Vía de administración</li>
                <li>Observaciones</li>
              </ul>
            </div>

           
          </div>



          <div
              v-if="pestañaActiva === 'hea'"
              class="p-6.5 space-y-6"
            >
              <div class="border-b pb-3">
                <h3 class="text-lg font-semibold text-gray-800">
                  HEA
                </h3>

                <p class="text-sm text-gray-500">
                  Historia de la Enfermedad Actual
                </p>
              </div>

              <!-- Historia de la Enfermedad Actual -->
              <div class="flex flex-col gap-2">
                <label class="font-medium text-gray-700">
                  Historia de la Enfermedad Actual
                </label>

                <textarea
                  v-model="formData.HistoriaEnfermedad"
                  rows="18"
                  class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Documente la historia de la enfermedad actual del paciente..."
                ></textarea>
              </div>

              <!-- Información a considerar -->
              <div class="rounded-lg border bg-gray-50 p-4">
                <p class="font-medium text-gray-700 mb-3">
                  Información a considerar
                </p>

                <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Motivo de consulta</li>
                  <li>Inicio de síntomas</li>
                  <li>Evolución</li>
                  <li>Síntomas asociados</li>
                  <li>Tratamientos previos</li>
                  <li>Otros datos relevantes</li>
                </ul>
              </div>

             
            </div>
      
       <!-- =============================== -->
        <!-- PESTAÑA: EXAMEN FÍSICO -->
        <!-- =============================== -->

        <div
          v-if="pestañaActiva === 'examenFisico'"
          class="p-6.5 space-y-6"
        >

          <!-- ENCABEZADO -->
          <div class="border-b pb-3">
            <h3 class="text-lg font-semibold text-gray-800">
              Examen Físico
            </h3>

            <p class="text-sm text-gray-500">
              Registre los signos vitales y parámetros físicos del paciente.
            </p>
          </div>


          <!-- =============================== -->
          <!-- SIGNOS VITALES -->
          <!-- =============================== -->

          <div>
            <h4 class="text-base font-semibold text-gray-800 mb-4">
              Signos Vitales
            </h4>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

              <!-- PRESIÓN ARTERIAL -->
              <div class="flex flex-col gap-2">

                <label
                  for="presionArterial"
                  class="font-medium text-gray-700"
                >
                  Presión arterial
                  <span class="text-gray-500">(PA)</span>

                </label>

                <input
                  id="presionArterial"
                  v-model="formData.PresionArterial"
                  type="text"
                   maxlength="6"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 120/80 mmHg"
                />

                <span class="text-xs text-gray-500">
                  Formato sugerido: 120/80 mmHg
                </span>

              </div>


              <!-- FRECUENCIA CARDÍACA -->
              <div class="flex flex-col gap-2">

                <label
                  for="frecuenciaCardiaca"
                  class="font-medium text-gray-700"
                >
                  Frecuencia cardíaca
                  <span class="text-gray-500">(FC)</span>
                </label>

                <input
                  id="frecuenciaCardiaca"
                  v-model.number="formData.FrecuenciaCardiaca"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 72"
                />

                <span class="text-xs text-gray-500">
                  Valor numérico
                </span>

              </div>


              <!-- FRECUENCIA RESPIRATORIA -->
              <div class="flex flex-col gap-2">

                <label
                  for="frecuenciaRespiratoria"
                  class="font-medium text-gray-700"
                >
                  Frecuencia respiratoria
                  <span class="text-gray-500">(FR)</span>
                </label>

                <input
                  id="frecuenciaRespiratoria"
                  v-model.number="formData.FrecuenciaRespiratoria"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 18"
                />

                <span class="text-xs text-gray-500">
                  Valor numérico
                </span>

              </div>


              <!-- SATURACIÓN DE OXÍGENO -->
              <div class="flex flex-col gap-2">

                <label
                  for="saturacionOxigeno"
                  class="font-medium text-gray-700"
                >
                  Saturación de oxígeno
                  <span class="text-gray-500">(SO2)</span>
                </label>

                <input
                  id="saturacionOxigeno"
                  v-model.number="formData.SaturacionOxigeno"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 98"
                />

                <span class="text-xs text-gray-500">
                  Valor numérico (%)
                </span>

              </div>


              <!-- PESO -->
              <div class="flex flex-col gap-2">

                <label
                  for="pesoExamenFisico"
                  class="font-medium text-gray-700"
                >
                  Peso
                  <span class="text-gray-500">(W)</span>
                </label>

                <input
                  id="pesoExamenFisico"
                  v-model.number="formData.PesoExamenFisico"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 72.50"
                />

                <span class="text-xs text-gray-500">
                  Valor decimal
                </span>

              </div>


              <!-- TEMPERATURA -->
              <div class="flex flex-col gap-2">

                <label
                  for="temperatura"
                  class="font-medium text-gray-700"
                >
                  Temperatura
                  <span class="text-gray-500">(T)</span>
                </label>

                  <input
                    id="temperatura"
                    v-model="formData.Temperatura"
                    type="text"
                    maxlength="4"
                    inputmode="decimal"
                    class="w-full border py-3 px-5 rounded"
                    placeholder="Ejemplo: 36.5"
                    @input="formData.Temperatura = formData.Temperatura
                      .replace(/[^0-9.]/g, '')
                      .replace(/(\..*)\./g, '$1')"
                  />

                <span class="text-xs text-gray-500">
                  Valor decimal
                </span>

              </div>

            </div>
          </div>


          <!-- =============================== -->
          <!-- REFERENCIA -->
          <!-- =============================== -->

          <div class="rounded-lg border bg-gray-50 p-4">

            <p class="font-medium text-gray-700 mb-3">
              Valores registrados
            </p>

            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">

              <li>
                PA - Presión arterial
              </li>

              <li>
                FC - Frecuencia cardíaca
              </li>

              <li>
                FR - Frecuencia respiratoria
              </li>

              <li>
                SO2 - Saturación de oxígeno
              </li>

              <li>
                W - Peso
              </li>

              <li>
                T - Temperatura
              </li>

            </ul>

          </div>
  

        </div>


        <!-- =============================== -->
        <!-- PESTAÑA: IMC -->
        <!-- =============================== -->

        <div
          v-if="pestañaActiva === 'imc'"
          class="p-6.5 space-y-6"
        >

          <!-- ENCABEZADO -->
          <div class="border-b pb-3">

            <h3 class="text-lg font-semibold text-gray-800">
              IMC — Índice de Masa Corporal
            </h3>

            <p class="text-sm text-gray-500">
              El índice de masa corporal se calcula automáticamente
              utilizando el peso y la estatura del paciente.
            </p>

          </div>


          <!-- =============================== -->
          <!-- DATOS PARA CALCULAR IMC -->
          <!-- =============================== -->

          <div>

            <h4 class="text-base font-semibold text-gray-800 mb-4">
              Datos antropométricos
            </h4>

            <div class="grid grid-cols-1 gap-6 md:grid-cols-2">

              <!-- PESO -->
              <div class="flex flex-col gap-2">

                <label
                  for="peso"
                  class="font-medium text-gray-700"
                >
                  Peso (kg)
                </label>

                <input
                  id="peso"
                  v-model.number="formData.Peso"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 80"
                />

              </div>


              <!-- ESTATURA -->
              <div class="flex flex-col gap-2">

                <label
                  for="estatura"
                  class="font-medium text-gray-700"
                >
                  Estatura (m)
                </label>

                <input
                  id="estatura"
                  v-model.number="formData.Estatura"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full border py-3 px-5 rounded"
                  placeholder="Ejemplo: 1.72"
                />

                <span class="text-xs text-gray-500">
                  Ingrese la estatura en metros. Ejemplo: 1.72
                </span>

              </div>

            </div>

          </div>


          <!-- =============================== -->
          <!-- RESULTADO IMC -->
          <!-- =============================== -->

          <div
            class="rounded-lg border bg-gray-50 p-6"
          >

            <div class="flex flex-col gap-3">

              <span class="text-sm font-medium text-gray-500">
                Índice de Masa Corporal
              </span>

              <div class="flex items-center gap-4">

                <span
                  v-if="imc !== null"
                  class="text-4xl font-bold text-blue-600"
                >
                  {{ imc }}
                </span>

                <span
                  v-else
                  class="text-lg text-gray-400"
                >
                  Ingrese peso y estatura
                </span>

              </div>

              <p class="text-sm text-gray-500">
                IMC = Peso (kg) / Estatura² (m)
              </p>           

            </div>

          </div>


          <!-- =============================== -->
          <!-- EJEMPLO -->
          <!-- =============================== -->

          <div class="rounded-lg border bg-blue-50 p-4">

            <p class="font-medium text-gray-700 mb-2">
              Ejemplo de cálculo
            </p>

            <ul class="list-disc list-inside space-y-1 text-sm text-gray-600">

              <li>
                Peso: 80 kg
              </li>

              <li>
                Estatura: 1.72 m
              </li>

              <li>
                IMC: 27.04
              </li>

            </ul>

          </div>


          <!-- =============================== -->
          <!-- REFERENCIA -->
          <!-- =============================== -->

          <div class="rounded-lg border bg-gray-50 p-4">

            <p class="font-medium text-gray-700 mb-2">
              Referencia
            </p>

            <p class="text-sm text-gray-600">
              Para consultar información adicional sobre el cálculo
              e interpretación del IMC, puede utilizar el calculador
              de IMC para adultos del CDC.
            </p>

            <a
              href="https://www.cdc.gov/bmi/adult-calculator/index.html"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block mt-3 text-blue-600 hover:underline font-medium"
            >
              Consultar calculador del CDC
            </a>

          </div>

        </div>

            <!-- ==================== ROAS ==================== -->
            <div v-if="pestañaActiva === 'roas'"  class="p-6.5 space-y-6">

              <div class="border-b pb-">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                       ROAS — Revisión por Aparatos y Sistemas
                </h2>

                <p class="text-sm text-gray-500">
                  Registre la información correspondiente a la revisión por aparatos y sistemas.
                </p>
              </div>

              <div>
                <label
                  for="roas"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Revisión por Aparatos y Sistemas
                </label>

                <textarea
                  id="roas"
                  v-model="formData.RevisionAparatosSistemas"
                  rows="18"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí la revisión por aparatos y sistemas..."
                ></textarea>
              </div>

            </div>


            <!-- ==================== LABORATORIOS ==================== -->
            <div v-if="pestañaActiva === 'laboratorios'" class="p-6.5 space-y-6">

              <div class="border-b pb-3">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  Laboratorios
                </h2>

                <p class="text-sm text-gray-500">
                  Registre los resultados de laboratorio y otros estudios realizados.
                </p>
              </div>

              <div>
                <label
                  for="laboratorios"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Resultados de Laboratorio
                </label>

                <textarea
                  id="laboratorios"
                  v-model="formData.ResultadosLaboratorio"
                  rows="18"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí los resultados de laboratorio y otros estudios..."
                ></textarea>
              </div> 

            </div>


            <!-- ==================== ECG ==================== -->
            <div v-if="pestañaActiva === 'ecg'" class="p-6.5 space-y-6">

              <div cla="border-b pb-3">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  ECG
                </h2>

                <p class="text-sm text-gray-500">
                  Registre la interpretación del electrocardiograma.
                </p>
              </div>

              <div>
                <label
                  for="ecg"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Interpretación del Electrocardiograma
                </label>

                <textarea
                  id="ecg"
                  v-model="formData.InterpretacionElectrocardiograma"
                  rows="18"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí la interpretación del electrocardiograma..."
                ></textarea>
              </div>      

            </div>


           <!-- ==================== IMÁGENES ==================== -->
            <div
              v-if="pestañaActiva === 'imagenes'"
              class="p-6.5 space-y-6"
            >

              <!-- ENCABEZADO -->
              <div class="border-b pb-3">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  Imágenes
                </h2>

                <p class="text-sm text-gray-500">
                  Registre los estudios de imagen realizados y adjunte los archivos
                  correspondientes.
                </p>
              </div>


              <!-- ==================== DESCRIPCIÓN ==================== -->
              <div>
                <label
                  for="imagenes"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Estudios de Imagen
                </label>

                <textarea
                  id="imagenes"
                  v-model="formData.EstudiosImagen"
                  rows="12"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí los estudios realizados, resultados e interpretación..."
                ></textarea>
              </div>


              <!-- ==================== TIPOS DE ESTUDIO ==================== -->
              <div
                class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
              >

                <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Tipos de estudios
                </h3>

                <div class="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2 dark:text-gray-300">

                  <div>• Radiografía</div>
                  <div>• Ultrasonido</div>
                  <div>• TAC</div>
                  <div>• Resonancia magnética</div>
                  <div>• Ecocardiograma</div>
                  <div>• Otros</div>

                </div>

              </div>


              <!-- ==================== ARCHIVOS ==================== -->
              <div class="space-y-4">

                <div>
                  <label
                    class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Archivos de estudios de imagen
                  </label>

                  <p class="mb-3 text-sm text-gray-500">
                    Puede adjuntar imágenes o documentos relacionados con los estudios
                    realizados.
                  </p>
                </div>


                <!-- INPUT ARCHIVOS -->
                <div
                  class="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-blue-400 dark:border-gray-600 dark:bg-gray-800"
                >

                  <input
                    id="archivosImagenes"
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    class="hidden"
                    @change="seleccionarImagenes"
                  />

                  <label
                    for="archivosImagenes"
                    class="cursor-pointer"
                  >

                    <div class="mb-3 text-4xl">
                      📎
                    </div>

                    <p class="font-medium text-gray-700 dark:text-gray-200">
                      Seleccionar archivos
                    </p>

                    <p class="mt-1 text-sm text-gray-500">
                      JPG, PNG, WEBP o PDF
                    </p>

                  </label>

                </div>


                <!-- ==================== LISTADO ARCHIVOS ==================== -->
                <div
                  v-if="archivosImagenes.length > 0"
                  class="space-y-3"
                >

                  <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Archivos seleccionados
                  </h3>


                  <div
                    v-for="(archivo, index) in archivosImagenes"
                    :key="`${archivo.nombre}-${index}`"
                    class="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                  >

                    <div class="flex min-w-0 items-center gap-3">

                      <div class="text-2xl">
                        {{
                          archivo.tipo === 'application/pdf'
                            ? '📄'
                            : '🖼️'
                        }}
                      </div>


                      <div class="min-w-0">

                        <p
                          class="truncate text-sm font-medium text-gray-800 dark:text-white"
                        >
                          {{ archivo.nombre }}
                        </p>

                        <p class="text-xs text-gray-500">
                          {{ formatearTamañoArchivo(archivo.tamaño) }}
                        </p>

                      </div>

                    </div>


                    <button
                      type="button"
                      @click="eliminarArchivoImagen(index)"
                      class="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
                    >
                      Eliminar
                    </button>

                  </div>

                </div>

              </div>


              <!-- ==================== BOTONES ==================== -->
               <div class="flex justify-start">

                <!-- Guardar descripción -->
                <button
                  type="button"
                  @click="enviarFormulario"
                  class="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Guardar Imágenes
                </button>


                <!-- Subir archivos -->
                <button
                  type="button"
                  @click="subirArchivosImagenes"
                  :disabled="cargandoImagen || archivosImagenes.length === 0"
                  class="rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <span v-if="cargandoImagen">
                    Subiendo...
                  </span>

                  <span v-else>
                    📎 Adjuntar archivos
                  </span>

                </button>

              </div>

            </div>

            <!-- =============================== -->
            <!-- PESTAÑA: RIESGO CARDIOVASCULAR -->
            <!-- =============================== -->

            <div
              v-if="pestañaActiva === 'riesgoCardiovascular'"
              class="p-6.5 space-y-6"
            >
              <!-- TÍTULO -->
              <div class="border-b pb-3">
                <h3 class="text-lg font-semibold text-gray-800">
                  Riesgo Cardiovascular
                </h3>

                <p class="text-sm text-gray-500">
                  Registre el resultado de la evaluación de riesgo cardiovascular del paciente.
                </p>
              </div>

              <!-- RESULTADO -->
              <div class="flex flex-col gap-2">
                <label
                  for="riesgoCardiovascular"
                  class="font-medium text-gray-700"
                >
                  Resultado de la evaluación
                </label>

                <textarea
                  id="riesgoCardiovascular"
                  v-model="formData.ResultadoEvaluacion"
                  rows="8"
                  class="w-full border py-3 px-5 rounded resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registre el resultado de la evaluación de riesgo cardiovascular..."
                ></textarea>

                <p class="text-sm text-gray-500">
                  El médico deberá registrar manualmente el resultado obtenido
                  en la evaluación de riesgo cardiovascular.
                </p>
              </div>

              <!-- REFERENCIA -->
              <div class="rounded-lg border bg-gray-50 p-4">
                <p class="font-medium text-gray-700 mb-2">
                  Información a registrar
                </p>

                <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
                  <li>Resultado de la evaluación</li>
                  <li>Nivel o categoría de riesgo, si aplica</li>
                  <li>Porcentaje de riesgo, si aplica</li>
                  <li>Observaciones médicas relevantes</li>
                </ul>
              </div>

              <!-- NOTA TÉCNICA -->
              <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p class="font-medium text-blue-800 mb-1">
                  Evaluación manual
                </p>

                <p class="text-sm text-blue-700">
                  En esta primera versión, el resultado será registrado manualmente
                  por el médico. La integración de una calculadora automática de
                  riesgo cardiovascular queda prevista como una mejora posterior.
                </p>
              </div>

            </div>


            <!-- ==================== IMPRESIÓN DIAGNÓSTICA ==================== -->
            <div
              v-if="pestañaActiva === 'impresionDiagnostica'"
             class="p-6.5 space-y-6"
            >

              <div class="border-b pb-3">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  Impresión Diagnóstica
                </h2>

                <p class="text-sm text-gray-500">
                  Registre uno o varios diagnósticos, observaciones y diagnóstico diferencial.
                </p>
              </div>

              <div>
                <label
                  for="impresionDiagnostica"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Impresión Diagnóstica
                </label>

                <textarea
                  id="impresionDiagnostica"
                  v-model="formData.Diagnostica"
                  rows="18"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí uno o varios diagnósticos, observaciones y diagnóstico diferencial..."
                ></textarea>
              </div>

            </div>


            <!-- ==================== PLAN TERAPÉUTICO ==================== -->
            <div
              v-if="pestañaActiva === 'planTerapeutico'"
              class="p-6.5 space-y-6"
            >

              <div class="border-b pb-3">
                <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                  Plan Terapéutico
                </h2>

                <p class="text-sm text-gray-500">
                  Registre el tratamiento indicado, estudios, recomendaciones y seguimiento del paciente.
                </p>
              </div>

              <div>
                <label
                  for="planTerapeutico"
                  class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tratamiento Indicado
                </label>

                <textarea
                  id="planTerapeutico"
                  v-model="formData.TratamientoIndicado"
                  rows="18"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Registre aquí medicamentos, dosis, indicaciones, estudios solicitados, recomendaciones, cambios de tratamiento y seguimiento..."
                ></textarea>
              </div>

         
           <!-- BOTÓN GUARDAR -->
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

            <!-- ==================== CRITERIOS DE ACEPTACIÓN ==================== -->
          
          
          
        </form>
 
       <!-- ===================== -->
        <!-- TABLA PACIENTES -->
        <!-- ===================== -->
       <DefaultCard cardTitle="Listado de Identificación de Pacientes" class="border-0 shadow-none">
              <table class="min-w-full divide-y divide-gray-200">

              <!-- HEADER -->
               <thead class="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
             
                  <tr>

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
                    Genero
                  </th>

                   <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                    Estado Civil
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

                  <!-- FECHA INGRESO 
                  <td class="px-6 py-4 whitespace-nowrap">

                    <div class="flex flex-col">
                      <span class="font-medium text-gray-800">
                        {{ formatearFecha(paciente.fecha) }}
                      </span>

                      <span class="text-xs text-gray-400">
                        Registro
                      </span>
                    </div>

                  </td> -->

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

                  <!-- GENERO -->
                  <td class="px-6 py-4">

                    <span
                      class="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100"
                    >
                    <span class="text-2xl">⚥</span>  {{ paciente.genero }}
                    </span>

                  </td>

                    <!-- ESTADO_CIVIL -->
                  <td class="px-6 py-4">

                    <span
                      class="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100"
                    >
                    {{ paciente.estadoCivil }}
                    </span>

                  </td>

                  <!-- DIRECCIÓN 
                  <td class="px-6 py-4 max-w-[220px]">

                    <div
                      class="truncate text-gray-600"
                      :title="paciente.direccion"
                    >
                      {{ paciente.direccion }}
                    </div>

                  </td> -->

                  <!-- ACCIONES -->
                  <td class="px-6 py-4">

                    <div class="flex items-center justify-center gap-2">

                  
                    <!-- EDITAR -->
                    <button
                      type="button"
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
        </DefaultCard>
       

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
        

      </DefaultCard>

      </div>
    </div>

  </DefaultLayout>
</template>
