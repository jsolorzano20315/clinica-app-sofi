<script setup lang="ts">
import { ref, onMounted } from 'vue'

/* =========================
   ⚙️ CONFIG
========================= */
const email = localStorage.getItem("email") || ''
const clinica = localStorage.getItem("clinica") || ''
const nombre = localStorage.getItem("nombre") || ''
const rol = (localStorage.getItem("rol") || '')
  .trim()
  .toLowerCase()


const API_URL = import.meta.env.VITE_API_URL

const API_URL_TotalCitasConfirmadas = `${API_URL}/Citas/TotalCitasConfi/${encodeURIComponent(clinica)}`
                                                 
const API_URL_TotalCitasPend = `${API_URL}/Citas/TotalCitasPend/${encodeURIComponent(clinica)}`

const API_URL_TotalCitasCance = `${API_URL}/Citas/TotalCitasCance/${encodeURIComponent(clinica)}`

const API_URL_TotalPacietes = `${API_URL}/Pacientes/TotalPacientes/${encodeURIComponent(clinica)}`

/* =========================
   📊 TIPOS
========================= */
interface CardItem {
  icon: string
  title: string
  total: number | string
  growthRate?: number
}

/* =========================
   📦 DATA INICIAL (SOLO UNA VEZ)
========================= */
const cardItems = ref<CardItem[]>([
  {
    icon: `<svg class="fill-primary dark:fill-white" width="22" height="16" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156Z"/>
    </svg>`,
    title: 'Total Citas Confirmadas',
    total: 0
  },
  {
    icon: `<svg
            class="fill-primary dark:fill-white"
            width="20"
            height="22"
            viewBox="0 0 20 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.0937 16.4312 11.7531 16.4312ZM11.7531 19.8687C11.2375 19.8687 10.825 19.4562 10.825 18.9406C10.825 18.425 11.2375 18.0125 11.7531 18.0125C12.2687 18.0125 12.6812 18.425 12.6812 18.9406C12.6812 19.4219 12.2343 19.8687 11.7531 19.8687Z"
              fill=""
            />
           <path
            d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10Zm-5 2a1 1 0 0 1 1 1v3h2a1 1 0 1 1 0 2h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z"
          />
                    <path
                      d="M19.0062 0.618744H17.15C16.325 0.618744 15.6031 1.23749 15.5 2.06249L14.95 6.01562H1.37185C1.0281 6.01562 0.684353 6.18749 0.443728 6.46249C0.237478 6.73749 0.134353 7.11562 0.237478 7.45937C0.237478 7.49374 0.237478 7.49374 0.237478 7.52812L2.36873 13.9562C2.50623 14.4375 2.9531 14.7812 3.46873 14.7812H12.9562C14.2281 14.7812 15.3281 13.8187 15.5 12.5469L16.9437 2.26874C16.9437 2.19999 17.0125 2.16562 17.0812 2.16562H18.9375C19.35 2.16562 19.7281 1.82187 19.7281 1.37499C19.7281 0.928119 19.4187 0.618744 19.0062 0.618744ZM14.0219 12.3062C13.9531 12.8219 13.5062 13.2 12.9906 13.2H3.7781L1.92185 7.56249H14.7094L14.0219 12.3062Z"
                      fill=""
                    />
          </svg>`,

    title: 'Total Citas Pendientes',
    total: 0
  },
  {
    icon: `<svg
            class="fill-primary dark:fill-white"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
           <path
            d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10Z"
          />
          <path
            d="M9.2 13.2a1 1 0 0 1 1.4 0L12 14.6l1.4-1.4a1 1 0 1 1 1.4 1.4L13.4 16l1.4 1.4a1 1 0 1 1-1.4 1.4L12 17.4l-1.4 1.4a1 1 0 1 1-1.4-1.4l1.4-1.4-1.4-1.4a1 1 0 0 1 0-1.4Z"
          />
                  </svg>`,

    title: 'Total Citas Canceladas',
    total: 0
  },
  {
      icon: `<svg
            class="fill-primary dark:fill-white"
            width="22"
            height="18"
            viewBox="0 0 22 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z"
              fill=""
            />
            <path
              d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z"
              fill=""
            />
            <path
              d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7874 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 16.975 1.13428 17.4906 1.7874 17.4906H20.2468C20.8999 17.4906 21.4499 16.9406 21.4499 16.2875V15.4625C21.4155 12.4719 18.9749 10.0313 15.9843 10.0313ZM2.16553 15.9438V13.8469C2.16553 11.9219 3.74678 10.3406 5.67178 10.3406H8.73115C10.6562 10.3406 12.2374 11.9219 12.2374 13.8469V15.9438H2.16553V15.9438ZM19.8687 15.9438H13.7499V13.8469C13.7499 13.2969 13.6468 12.7469 13.4749 12.2313C14.0937 11.7844 14.8499 11.5781 15.6405 11.5781H15.9499C18.0812 11.5781 19.8343 13.3313 19.8343 15.4625V15.9438H19.8687Z"
              fill=""
            />
          </svg>`,
    title: 'Total Pacientes',
    total: 0
  }
])

/* =========================
   🔌 API CALL
========================= */
const obtenerDatos = async () => {
  try {
    const [
      confirmadasRes,
      pendientesRes,
      canceladasRes,
      pacientesRes
    ] = await Promise.all([
      fetch(API_URL_TotalCitasConfirmadas),
      fetch(API_URL_TotalCitasPend),
      fetch(API_URL_TotalCitasCance),
      fetch(API_URL_TotalPacietes)
    ])

    const confirmadas = await confirmadasRes.json()
    const pendientes = await pendientesRes.json()
    const canceladas = await canceladasRes.json()
    const pacientes = await pacientesRes.json()

    // 🔥 Soporta API que devuelve número o objeto
    cardItems.value[0].total = confirmadas?.total ?? confirmadas
    cardItems.value[1].total = pendientes?.total ?? pendientes
    cardItems.value[2].total = canceladas?.total ?? canceladas
    cardItems.value[3].total = pacientes?.total ?? pacientes



  } catch (error) {
    console.error("❌ Error cargando datos:", error)
  }
}

/* =========================
   🚀 INIT
========================= */
onMounted(() => {
  if (!clinica) {
    console.warn("Clinica no definida")
    return
  }

  obtenerDatos()
  
})
</script>

<template>
  <!-- Card Item Start -->
  <div
    v-for="(item, index) in cardItems"
    :key="index"
    class="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark"
  >
    <!-- ICON -->
    <div
      class="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4"
      v-html="item.icon"
    ></div>

    <!-- CONTENT -->
    <div class="mt-4 flex items-end justify-between">
      <div>   
        <span class="text-sm font-medium">
          {{ item.title }}
        </span>

         <h4 class="text-title-md font-bold text-black dark:text-white">
          {{ item.total }}
        </h4>
      </div>

      <!-- GROWTH (SOLO SI EXISTE) -->
      <span
        v-if="item.growthRate !== undefined"
        class="flex items-center gap-1 text-sm font-medium"
        :class="{
          'text-meta-3': item.growthRate > 0,
          'text-meta-5': item.growthRate < 0
        }"
      >
        {{ item.growthRate }}%

        <!-- UP -->
        <svg
          v-if="item.growthRate > 0"
          class="fill-meta-3"
          width="10"
          height="11"
          viewBox="0 0 10 11"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.35716 2.47737L0.908974 5.82987L5.0000005e-7 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737V10.0849H4.35716V2.47737Z"
          />
        </svg>

        <!-- DOWN -->
        <svg
          v-if="item.growthRate < 0"
          class="fill-meta-5"
          width="10"
          height="11"
          viewBox="0 0 10 11"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.64284 7.69237L9.09102 4.33987L10 5.22362L5 10.0849L-8.98488e-7 5.22362L0.908973 4.33987L4.35716 7.69237V0.0848701H5.64284V7.69237Z"
          />
        </svg>
      </span>
    </div>
  </div>
  <!-- Card Item End -->
</template>

