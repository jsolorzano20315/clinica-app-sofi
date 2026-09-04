<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed } from 'vue'

// Título de la página
const pageTitle = ref('Especialidades')

// Estructura de los datos del formulario
interface FormData {
  Id: number
  Nombre: string
}

// Objeto reactivo para el formulario
const formData = ref<FormData>({ Id: 0, Nombre: '' })

// Arreglo reactivo para guardar registros
const registros = ref<FormData[]>([])

// Para editar registros
const editId = ref<number | null>(null)

// --- PAGINACIÓN ---
const currentPage = ref(1)
const pageSize = ref(4) // registros por página
const totalPages = computed(() => Math.ceil(registros.value.length / pageSize.value))
const paginatedRegistros = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return registros.value.slice(start, end)
})

// Función para guardar o actualizar registros
const enviarFormulario = () => {
  if (editId.value !== null) {
    // Actualizar registro existente
    const index = registros.value.findIndex(r => r.Id === editId.value)
    if (index !== -1) {
      registros.value[index].Nombre = formData.value.Nombre
    }
    editId.value = null
  } else {
    // Crear nuevo registro
    const nuevoRegistro = { ...formData.value, Id: registros.value.length + 1 }
    registros.value.push(nuevoRegistro)
  }

  // Limpiar formulario
  formData.value = { Id: 0, Nombre: '' }
}

// Función para editar un registro
const editarRegistro = (registro: FormData) => {
  formData.value = { ...registro }
  editId.value = registro.Id
}

// Función para eliminar un registro
const eliminarRegistro = (id: number) => {
  registros.value = registros.value.filter(r => r.Id !== id)
  // Ajustar página si eliminamos último elemento de la página
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
}

// Cambiar de página
const cambiarPagina = (pagina: number) => {
  if (pagina >= 1 && pagina <= totalPages.value) {
    currentPage.value = pagina
  }
}
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault :pageTitle="pageTitle" />

    <div class="flex justify-center">
      <div class="w-full max-w-5xl space-y-8">

        <!-- Formulario -->
        <DefaultCard :cardTitle="editId !== null ? 'Editar Especialidad' : 'Ingreso de Especialidades'">
          <form @submit.prevent="enviarFormulario">
            <div class="p-6.5">
              <div class="mb-4.5 flex flex-col gap-6 xl:flex-row xl:items-center">
                <div class="flex flex-col xl:flex-row xl:items-center w-full xl:w-1/2 gap-2">
                  <label class="block mb-2 xl:mb-0 font-semibold text-gray-700">Nombre</label>
                  <input
                    type="text"
                    v-model="formData.Nombre"
                    class="w-full border border-gray-300 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Ingrese la especialidad"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                class="flex justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-0"
              >
                {{ editId !== null ? 'Actualizar' : 'Guardar Datos' }}
              </button>
            </div>
          </form>
        </DefaultCard>

        <!-- Grid de registros -->
        <DefaultCard cardTitle="Lista de Especialidades">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="registro in paginatedRegistros" :key="registro.Id">
                  <td class="px-6 py-4 whitespace-nowrap">{{ registro.Id }}</td>
                  <td class="px-6 py-4 whitespace-nowrap">{{ registro.Nombre }}</td>
                  <td class="px-6 py-4 whitespace-nowrap space-x-2">
                    <button @click="editarRegistro(registro)" class="text-blue-500 hover:underline">Editar</button>
                    <button @click="eliminarRegistro(registro.Id)" class="text-red-500 hover:underline">Eliminar</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-if="registros.length === 0" class="p-4 text-gray-500">No hay registros ingresados.</p>
          </div>

          <!-- Paginación -->
          <div class="flex justify-center gap-2 mt-4">
            <button
              @click="cambiarPagina(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              v-for="pagina in totalPages"
              :key="pagina"
              @click="cambiarPagina(pagina)"
              :class="{'bg-blue-500 text-white': currentPage === pagina, 'border px-3 py-1 rounded': currentPage !== pagina}"
            >
              {{ pagina }}
            </button>
            <button
              @click="cambiarPagina(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </DefaultCard>

      </div>
    </div>
  </DefaultLayout>
</template>
