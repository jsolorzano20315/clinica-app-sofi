<template>
  <div class="space-y-6">

    <!-- ========================================================= -->
    <!-- DOCUMENTOS REGISTRADOS -->
    <!-- ========================================================= -->

    <div
      class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
    >

      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">
            Documentos registrados
          </h3>

          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Archivos almacenados para este paciente.
          </p>
        </div>

        <span
          v-if="!cargandoDocumentos"
          class="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
        >
          {{ documentosPaciente.length }}
          {{ documentosPaciente.length === 1 ? 'documento' : 'documentos' }}
        </span>

      </div>


      <!-- ======================================================= -->
      <!-- CARGANDO -->
      <!-- ======================================================= -->

      <div
        v-if="cargandoDocumentos"
        class="flex items-center justify-center py-10"
      >

        <div class="text-center">

          <div class="mb-3 text-3xl">
            ⏳
          </div>

          <p class="text-sm text-gray-500">
            Cargando documentos...
          </p>

        </div>

      </div>


      <!-- ======================================================= -->
      <!-- SIN DOCUMENTOS -->
      <!-- ======================================================= -->

      <div
        v-else-if="documentosPaciente.length === 0"
        class="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-10 text-center dark:border-gray-600 dark:bg-gray-900"
      >

        <div class="mb-3 text-4xl">
          📂
        </div>

        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
          No hay documentos registrados
        </p>

        <p class="mt-1 text-xs text-gray-500">
          Los archivos que adjunte aparecerán aquí.
        </p>

      </div>


      <!-- ======================================================= -->
      <!-- LISTA -->
      <!-- ======================================================= -->

      <div
        v-else
        class="space-y-3"
      >

        <div
          v-for="documento in documentosPaciente"
          :key="documento.idArchivoImagen"
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900"
        >

          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          >

            <!-- INFORMACIÓN -->
            <div class="flex min-w-0 items-center gap-4">

              <!-- ICONO -->
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                :class="
                  esPDF(documento.tipoArchivo)
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                    : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                "
              >
                {{ obtenerIcono(documento.tipoArchivo) }}
              </div>


              <!-- DATOS -->
              <div class="min-w-0">

                <p
                  class="truncate text-sm font-semibold text-gray-800 dark:text-white"
                  :title="documento.nombreArchivo"
                >
                  {{ documento.nombreArchivo }}
                </p>


                <div
                  class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500"
                >

                  <span>
                    {{ obtenerTipoTexto(documento.tipoArchivo) }}
                  </span>

                  <span>
                    •
                  </span>

                  <span>
                    📅 {{ formatearFecha(documento.fecha) }}
                  </span>

                </div>

              </div>

            </div>


            <!-- ACCIONES -->
            <div
              class="flex flex-wrap items-center gap-2 lg:justify-end"
            >

              <!-- VER -->
              <button
                type="button"
                @click="visualizarDocumento(documento)"
                class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {{ esPDF(documento.tipoArchivo) ? '📄' : '📷' }}
                Ver
              </button>


              <!-- DESCARGAR -->
              <button
                type="button"
                @click="descargarDocumento(documento)"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                ⬇️
                Descargar
              </button>


              <!-- ELIMINAR -->
              <button
                type="button"
                @click="solicitarEliminarDocumento(documento)"
                :disabled="
                  eliminandoDocumento === documento.idArchivoImagen
                "
                class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
              >
                <span
                  v-if="eliminandoDocumento === documento.idArchivoImagen"
                >
                  ⏳
                </span>

                <span v-else>
                  🗑️
                </span>

                Eliminar
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>


    <!-- ========================================================= -->
    <!-- MODAL VISUALIZACIÓN -->
    <!-- ========================================================= -->

    <div
      v-if="mostrarModalVisualizacion && documentoVisualizando"
      class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4"
      @click.self="cerrarModalVisualizacion"
    >

      <div
        class="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800"
      >

        <!-- HEADER MODAL -->
        <div
          class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700"
        >

          <div class="min-w-0">

            <h3
              class="truncate text-base font-semibold text-gray-800 dark:text-white"
              :title="documentoVisualizando.nombreArchivo"
            >
              {{ documentoVisualizando.nombreArchivo }}
            </h3>

            <p class="mt-1 text-xs text-gray-500">
              {{ obtenerTipoTexto(documentoVisualizando.tipoArchivo) }}
              ·
              {{ formatearFecha(documentoVisualizando.fecha) }}
            </p>

          </div>


          <button
            type="button"
            @click="cerrarModalVisualizacion"
            class="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
            aria-label="Cerrar"
          >
            ✕
          </button>

        </div>


        <!-- CONTENIDO -->
        <div
          class="flex min-h-[300px] flex-1 items-center justify-center overflow-auto bg-gray-100 p-4 dark:bg-gray-950"
        >

          <!-- IMAGEN -->
          <img
            v-if="esImagen(documentoVisualizando.tipoArchivo)"
            :src="obtenerUrlVisualizacion(documentoVisualizando)"
            :alt="documentoVisualizando.nombreArchivo"
            class="max-h-[75vh] max-w-full rounded-lg object-contain shadow-lg"
          />


          <!-- PDF -->
          <iframe
            v-else-if="esPDF(documentoVisualizando.tipoArchivo)"
            :src="obtenerUrlVisualizacion(documentoVisualizando)"
            class="h-[75vh] w-full rounded-lg border border-gray-300 bg-white"
            title="Visualización del documento PDF"
          ></iframe>


          <!-- OTRO -->
          <div
            v-else
            class="py-10 text-center"
          >

            <div class="mb-3 text-4xl">
              📄
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-300">
              Este tipo de archivo no tiene vista previa.
            </p>

          </div>

        </div>


        <!-- FOOTER -->
        <div
          class="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700"
        >

          <button
            type="button"
            @click="descargarDocumento(documentoVisualizando)"
            class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            ⬇️ Descargar
          </button>

          <button
            type="button"
            @click="cerrarModalVisualizacion"
            class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cerrar
          </button>

        </div>

      </div>

    </div>


    <!-- ========================================================= -->
    <!-- MODAL CONFIRMACIÓN ELIMINAR -->
    <!-- ========================================================= -->

    <div
      v-if="mostrarConfirmacionDocumento && documentoAEliminar"
      class="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-4"
      @click.self="cancelarEliminarDocumento"
    >

      <div
        class="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
      >

        <!-- ICONO -->
        <div class="mb-4 flex justify-center">

          <div
            class="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl dark:bg-red-900/30"
          >
            🗑️
          </div>

        </div>


        <h3
          class="text-center text-lg font-semibold text-gray-800 dark:text-white"
        >
          ¿Eliminar documento?
        </h3>


        <p class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Esta acción eliminará el documento de la lista y también intentará
          eliminar el archivo físico.
        </p>


        <div
          class="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-900"
        >

          <p
            class="truncate text-center text-sm font-medium text-gray-700 dark:text-gray-200"
            :title="documentoAEliminar.nombreArchivo"
          >
            {{ documentoAEliminar.nombreArchivo }}
          </p>

        </div>


        <!-- BOTONES -->
        <div class="mt-6 flex justify-end gap-3">

          <button
            type="button"
            @click="cancelarEliminarDocumento"
            :disabled="eliminandoDocumento !== null"
            class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Cancelar
          </button>


          <button
            type="button"
            @click="confirmarEliminarDocumento"
            :disabled="eliminandoDocumento !== null"
            class="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <span v-if="eliminandoDocumento !== null">
              ⏳ Eliminando...
            </span>

            <span v-else>
              🗑️ Sí, eliminar
            </span>

          </button>

        </div>

      </div>

    </div>

  </div>
</template>


<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'


// ================================================================
// PROPS
// ================================================================

interface Props {
  idPaciente: number
  clinica: string
  mostrarAlerta?: (
    mensaje: string,
    tipo?: 'success' | 'error' | 'warning' | 'info'
  ) => void
}

const props = withDefaults(defineProps<Props>(), {
  mostrarAlerta: undefined
})


// ================================================================
// API
// ================================================================

const API_URL = import.meta.env.VITE_API_URL


// ================================================================
// INTERFACES
// ================================================================

interface ArchivoPendiente {
  nombre: string
  tipo: string
  tamaño: number
  archivo: File
}


interface DocumentoPaciente {
  idArchivoImagen: number
  idImagen: number
  nombreArchivo: string
  tipoArchivo: string
  fecha: string
  url?: string
}


// ================================================================
// ESTADOS
// ================================================================

const archivosPendientes = ref<ArchivoPendiente[]>([])

const documentosPaciente = ref<DocumentoPaciente[]>([])

const cargandoImagen = ref(false)

const cargandoDocumentos = ref(false)

const eliminandoDocumento = ref<number | null>(null)

const documentoVisualizando =
  ref<DocumentoPaciente | null>(null)

const documentoAEliminar =
  ref<DocumentoPaciente | null>(null)

const mostrarModalVisualizacion = ref(false)

const mostrarConfirmacionDocumento = ref(false)

const inputArchivos = ref<HTMLInputElement | null>(null)


// ================================================================
// PACIENTE VÁLIDO
// ================================================================

const idPacienteValido = computed(() => {
  return Number(props.idPaciente) > 0
})


// ================================================================
// ALERTA
// ================================================================

const alerta = (
  mensaje: string,
  tipo: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {

  if (props.mostrarAlerta) {
    props.mostrarAlerta(mensaje, tipo)
    return
  }

  console.log(`[${tipo}] ${mensaje}`)
}


// ================================================================
// ICONOS
// ================================================================

const esPDF = (tipo: string) => {

  if (!tipo) {
    return false
  }

  return tipo.toLowerCase() === 'application/pdf'
}


const esImagen = (tipo: string) => {

  if (!tipo) {
    return false
  }

  const tipoNormalizado = tipo.toLowerCase()

  return (
    tipoNormalizado === 'image/jpeg' ||
    tipoNormalizado === 'image/jpg' ||
    tipoNormalizado === 'image/png' ||
    tipoNormalizado === 'image/webp'
  )
}


const obtenerIcono = (tipo: string) => {

  if (esPDF(tipo)) {
    return '📄'
  }

  if (esImagen(tipo)) {
    return '📷'
  }

  return '📎'
}


const obtenerTipoTexto = (tipo: string) => {

  if (esPDF(tipo)) {
    return 'Documento PDF'
  }

  if (tipo?.toLowerCase() === 'image/jpeg') {
    return 'Imagen JPG'
  }

  if (tipo?.toLowerCase() === 'image/jpg') {
    return 'Imagen JPG'
  }

  if (tipo?.toLowerCase() === 'image/png') {
    return 'Imagen PNG'
  }

  if (tipo?.toLowerCase() === 'image/webp') {
    return 'Imagen WEBP'
  }

  return tipo || 'Archivo'
}


// ================================================================
// TAMAÑO
// ================================================================

const formatearTamaño = (bytes: number) => {

  if (!bytes || bytes <= 0) {
    return '0 Bytes'
  }

  const unidades = [
    'Bytes',
    'KB',
    'MB',
    'GB'
  ]

  const indice = Math.floor(
    Math.log(bytes) / Math.log(1024)
  )

  const indiceSeguro = Math.min(
    indice,
    unidades.length - 1
  )

  return `${(
    bytes / Math.pow(1024, indiceSeguro)
  ).toFixed(2)} ${unidades[indiceSeguro]}`
}


// ================================================================
// FECHA
// ================================================================

const formatearFecha = (fecha: string) => {

  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaConvertida = new Date(fecha)

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha
  }

  return fechaConvertida.toLocaleDateString(
    'es-HN',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  )
}


// ================================================================
// SELECCIONAR ARCHIVOS
// ================================================================

const seleccionarArchivos = (event: Event) => {

  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  const archivos = Array.from(input.files)

  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ]

  for (const archivo of archivos) {

    if (!tiposPermitidos.includes(archivo.type)) {

      alerta(
        `El archivo "${archivo.name}" no es válido. Solo se permiten JPG, PNG, WEBP y PDF.`,
        'warning'
      )

      continue
    }


    if (archivo.size <= 0) {

      alerta(
        `El archivo "${archivo.name}" está vacío.`,
        'warning'
      )

      continue
    }


    const existe = archivosPendientes.value.some(
      item =>
        item.nombre === archivo.name &&
        item.tamaño === archivo.size
    )


    if (existe) {
      continue
    }


    archivosPendientes.value.push({
      nombre: archivo.name,
      tipo: archivo.type,
      tamaño: archivo.size,
      archivo
    })
  }


  input.value = ''
}


// ================================================================
// ELIMINAR ARCHIVO PENDIENTE
// ================================================================

const eliminarArchivoPendiente = (index: number) => {

  if (
    index < 0 ||
    index >= archivosPendientes.value.length
  ) {
    return
  }

  archivosPendientes.value.splice(index, 1)
}


// ================================================================
// SUBIR ARCHIVOS
// ================================================================

const subirArchivos = async () => {

  if (!idPacienteValido.value) {

    alerta(
      'Primero debe guardar el paciente antes de adjuntar documentos.',
      'warning'
    )

    return
  }


  if (!props.clinica) {

    alerta(
      'No se encontró la clínica del paciente.',
      'warning'
    )

    return
  }


  if (archivosPendientes.value.length === 0) {

    alerta(
      'Debe seleccionar al menos un archivo.',
      'warning'
    )

    return
  }


  try {

    cargandoImagen.value = true


    const datos = new FormData()

    datos.append(
      'IdPaciente',
      String(props.idPaciente)
    )

    datos.append(
      'Clinica',
      props.clinica
    )


    for (const item of archivosPendientes.value) {

      datos.append(
        'Archivos',
        item.archivo,
        item.nombre
      )
    }


    await axios.post(
      `${API_URL}/Pacientes/SubirImagenes`,
      datos,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )


    alerta(
      'Los archivos fueron registrados correctamente.',
      'success'
    )


    // Limpiar archivos pendientes
    archivosPendientes.value = []


    // Recargar automáticamente
    await cargarDocumentosPaciente()

  }
  catch (error: unknown) {

    console.error(
      'Error al subir archivos:',
      error
    )


    let mensaje =
      'Error al registrar los archivos.'


    if (axios.isAxiosError(error)) {

      mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        mensaje
    }


    alerta(
      mensaje,
      'error'
    )

  }
  finally {

    cargandoImagen.value = false

  }
}


// ================================================================
// CARGAR DOCUMENTOS
// ================================================================

const cargarDocumentosPaciente = async () => {

  console.log(
    '📄 Cargando documentos del paciente:',
    props.idPaciente
  )

  if (!idPacienteValido.value) {

    console.log(
      '⚠️ IdPaciente no válido:',
      props.idPaciente
    )

    documentosPaciente.value = []

    return
  }

  try {

    cargandoDocumentos.value = true

    const url =
      `${API_URL}/Pacientes/ListaDocumentos/${props.idPaciente}`

    console.log(
      '📄 URL documentos:',
      url
    )

    const response = await axios.get(url)

    console.log(
      '📄 Respuesta documentos:',
      response.data
    )


    // ============================================================
    // OBTENER LISTA
    // ============================================================

    const documentos =
      Array.isArray(response.data)
        ? response.data
        : response.data?.documentos || []


    console.log(
      '📄 Cantidad de documentos:',
      documentos.length
    )


    // ============================================================
    // NORMALIZAR RESPUESTA DEL API
    // ============================================================

    documentosPaciente.value = documentos.map((documento: any) => {

      const documentoNormalizado: DocumentoPaciente = {

        // PK de la tabla de archivos.
        // Soporta diferentes nombres que pueda devolver el API.
        idArchivoImagen:
          documento.idArchivoImagen ??
          documento.IdArchivoImagen ??
          documento.dArchivoImagen ??
          documento.DArchivoImagen ??
          0,

        // IdImagen
        idImagen:
          documento.idImagen ??
          documento.IdImagen ??
          0,

        // Nombre del archivo
        nombreArchivo:
          documento.nombreArchivo ??
          documento.NombreArchivo ??
          '',

        // Tipo MIME
        tipoArchivo:
          documento.tipoArchivo ??
          documento.TipoArchivo ??
          '',

        // Fecha
        fecha:
          documento.fecha ??
          documento.Fecha ??
          '',

        // Ruta solamente se conserva si el API la devuelve.
        // No se utiliza directamente en el navegador.
        url:
          documento.url ??
          documento.Url ??
          undefined

      }

      console.log(
        '📄 Documento normalizado:',
        documentoNormalizado
      )

      return documentoNormalizado

    })


    console.log(
      '📄 DOCUMENTOS FINALES PARA LA PANTALLA:',
      documentosPaciente.value
    )

  }
  catch (error: unknown) {

    console.error(
      '❌ Error al cargar documentos:',
      error
    )

    documentosPaciente.value = []

    let mensaje =
      'No fue posible cargar los documentos.'


    if (axios.isAxiosError(error)) {

      mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        mensaje
    }


    alerta(
      mensaje,
      'error'
    )

  }
  finally {

    cargandoDocumentos.value = false

  }
}

// ================================================================
// URL PARA VISUALIZAR
// ================================================================

const obtenerUrlVisualizacion = (
  documento: DocumentoPaciente
) => {

  return (
    `${API_URL}/Pacientes/VerDocumento/` +
    `${documento.idArchivoImagen}`
  )
}


// ================================================================
// URL PARA DESCARGAR
// ================================================================

const obtenerUrlDescarga = (
  documento: DocumentoPaciente
) => {

  return (
    `${API_URL}/Pacientes/DescargarDocumento/` +
    `${documento.idArchivoImagen}`
  )
}


// ================================================================
// VISUALIZAR DOCUMENTO
// ================================================================

const visualizarDocumento = (
  documento: DocumentoPaciente
) => {

  documentoVisualizando.value = documento

  mostrarModalVisualizacion.value = true
}


// ================================================================
// CERRAR MODAL
// ================================================================

const cerrarModalVisualizacion = () => {

  mostrarModalVisualizacion.value = false

  documentoVisualizando.value = null
}


// ================================================================
// DESCARGAR
// ================================================================

const descargarDocumento = (
  documento: DocumentoPaciente
) => {

  if (!documento?.idArchivoImagen) {

    alerta(
      'No se encontró el identificador del documento.',
      'warning'
    )

    return
  }


  const url =
    obtenerUrlDescarga(documento)


  const enlace =
    document.createElement('a')

  enlace.href = url

  enlace.target = '_blank'

  enlace.rel = 'noopener noreferrer'

  document.body.appendChild(enlace)

  enlace.click()

  document.body.removeChild(enlace)
}


// ================================================================
// SOLICITAR ELIMINACIÓN
// ================================================================

const solicitarEliminarDocumento = (
  documento: DocumentoPaciente
) => {

  documentoAEliminar.value = documento

  mostrarConfirmacionDocumento.value = true
}


// ================================================================
// CANCELAR ELIMINAR
// ================================================================

const cancelarEliminarDocumento = () => {

  if (eliminandoDocumento.value !== null) {
    return
  }

  mostrarConfirmacionDocumento.value = false

  documentoAEliminar.value = null
}


// ================================================================
// CONFIRMAR ELIMINAR
// ================================================================

const confirmarEliminarDocumento = async () => {

  const documento =
    documentoAEliminar.value


  if (!documento) {
    return
  }


  try {

    eliminandoDocumento.value =
      documento.idArchivoImagen


    await axios.delete(
      `${API_URL}/Pacientes/EliminarDocumento/${documento.idArchivoImagen}`
    )


    alerta(
      'El documento fue eliminado correctamente.',
      'success'
    )


    mostrarConfirmacionDocumento.value = false

    documentoAEliminar.value = null


    // Recargar automáticamente
    await cargarDocumentosPaciente()

  }
  catch (error: unknown) {

    console.error(
      'Error al eliminar documento:',
      error
    )


    let mensaje =
      'No fue posible eliminar el documento.'


    if (axios.isAxiosError(error)) {

      mensaje =
        error.response?.data?.message ||
        error.response?.data?.mensaje ||
        mensaje
    }


    alerta(
      mensaje,
      'error'
    )

  }
  finally {

    eliminandoDocumento.value = null

  }
}


// ================================================================
// ESCAPE PARA CERRAR MODALES
// ================================================================

const manejarTeclaEscape = (event: KeyboardEvent) => {

  if (event.key !== 'Escape') {
    return
  }


  if (mostrarModalVisualizacion.value) {

    cerrarModalVisualizacion()

    return
  }


  if (mostrarConfirmacionDocumento.value) {

    cancelarEliminarDocumento()
  }
}


// ================================================================
// WATCH
// ================================================================

watch(
  () => props.idPaciente,
  async (nuevoId, antiguoId) => {

    if (nuevoId !== antiguoId) {

      archivosPendientes.value = []

      documentoVisualizando.value = null

      documentoAEliminar.value = null

      mostrarModalVisualizacion.value = false

      mostrarConfirmacionDocumento.value = false

      await cargarDocumentosPaciente()
    }
  }
)


// ================================================================
// MOUNT
// ================================================================

onMounted(async () => {

  window.addEventListener(
    'keydown',
    manejarTeclaEscape
  )


  await cargarDocumentosPaciente()

})

</script>