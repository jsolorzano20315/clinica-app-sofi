<script setup lang="ts">
import BreadcrumbDefault from '@/components/Breadcrumbs/BreadcrumbDefault.vue'
import DefaultCard from '@/components/Forms/DefaultCard.vue'
import InputGroup from '@/components/Forms/InputGroup.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { ref, computed } from 'vue'

// Título de la página
const pageTitle = ref('Doctores')

// Estructura de los datos del formulario
interface FormData {
  Id: number
  Nombre: string
  EspecialidadId: number
  Telefono: string
  Email: string
}

// Objeto reactivo para guardar los datos
const formData = ref<FormData>({
  Id: 0,
  Nombre: '',
  EspecialidadId: 0,
  Telefono: '',
  Email: ''
})

// Opciones de especialidad
const especialidades = [
  { id: 1, nombre: 'Cardiología' },
  { id: 2, nombre: 'Pediatría' },
  { id: 3, nombre: 'Dermatología' },
  { id: 4, nombre: 'Neurología' },
  { id: 5, nombre: 'Odontólogo' }
]

// Lista de doctores
const doctorsList = ref<FormData[]>([])


// Reset formulario
const resetForm = () => {
  formData.value = { Id: 0, Nombre: '', EspecialidadId: 0, Telefono: '', Email: '' }
}

// Cambiar página
const cambiarPagina = (num: number) => {
  if (num >= 1 && num <= totalPages.value) currentPage.value = num
}
</script>

<template>
  <DefaultLayout>
    <BreadcrumbDefault :pageTitle="pageTitle" />

    <div class="flex justify-center">
      <div class="w-full max-w-7xl">

     <!-- Formulario -->
      <DefaultCard cardTitle="Ingrese Datos Generales del Doctor">
        <form @submit.prevent="enviarFormulario">
          <div class="p-6.5 space-y-6">
            
            <!-- Fila: Nombre y Telefono -->
            <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">
              <!-- Nombre -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="block mb-2.5">Nombre</label>
                <input
                  type="text"
                  v-model="formData.Nombre"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

              <!-- Telefono -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="block mb-2.5">Telefono</label>
                <input
                  type="tel"
                  v-model="formData.Telefono"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>
            </div>

            <!-- Fila: Email y Especialidad -->
            <div class="flex flex-col gap-6 xl:flex-row xl:gap-4">
              <!-- Email -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="block mb-2.5">Email</label>
                <input
                  type="email"
                  v-model="formData.Email"
                  class="w-full border py-3 px-5 rounded"
                  required
                />
              </div>

              <!-- Especialidad -->
              <div class="flex flex-col w-full xl:w-1/2 gap-2">
                <label class="block mb-2.5">Especialidad</label>
                <select
                  v-model.number="formData.EspecialidadId"
                  class="w-full rounded border border-stroke bg-transparent py-3 px-5 outline-none transition focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  :class="{ 'text-black dark:text-white': formData.EspecialidadId !== 0 }"
                >
                  <option value="0" disabled>--Seleccionar--</option>
                  <option v-for="esp in especialidades" :key="esp.id" :value="esp.id">{{ esp.nombre }}</option>
                </select>
              </div>
            </div>

            <!-- Botón -->
            <div class="flex justify-start">
              <button type="submit" class="rounded bg-primary p-3 text-white">
                Guardar Datos
              </button>
            </div>

          </div>
        </form>
      </DefaultCard>

     <!-- Tabla de doctores -->
    <DefaultCard cardTitle="Lista de Doctores">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-left">
          <thead class="bg-gray-50">
            <tr>
              <th class="hidden">>ID</th><!-- Oculto -->
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Especialidad</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th class="px-6 py-3 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="doctor in paginatedDoctors" :key="doctor.Id">
              <td class="hidden">{{ doctor.Id }}</td> <!-- Oculto -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ doctor.Nombre }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ especialidades.find(e => e.id === doctor.EspecialidadId)?.nombre }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ doctor.Telefono }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ doctor.Email }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
                <button class="text-blue-500 mr-2" @click="editarDoctor(doctor)">Editar</button>
                <button class="text-red-500" @click="eliminarDoctor(doctor.Id)">Eliminar</button>
              </td>
            </tr>
            <tr v-if="doctorsList.length === 0">
              <td colspan="6" class="text-center px-6 py-4">No hay doctores registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex justify-center mt-4 space-x-2">
        <button @click="cambiarPagina(currentPage - 1)" :disabled="currentPage === 1" class="px-3 py-1 border rounded">Siguiente</button>
        <span class="px-3 py-1 border rounded">{{ currentPage }}</span>
        <button @click="cambiarPagina(currentPage + 1)" :disabled="currentPage === totalPages" class="px-3 py-1 border rounded">Anterior</button>
      </div>
    </DefaultCard>
      </div>
    </div>
  </DefaultLayout>
</template>
