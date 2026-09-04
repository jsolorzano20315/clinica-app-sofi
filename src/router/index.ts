import { createRouter, createWebHashHistory  } from 'vue-router'


import CalendarView from '@/views/CalendarView.vue'
import ECommerceView from '@/views/Dashboard/ECommerceView.vue'


import Login from "../views/Login.vue";
import Citas from "../views/Citas.vue";
import Pacientes from "../views/Pacientes.vue";
import Facturas from "../views/Facturas.vue";
import ListaCitasMedicas from "../views/ListaCitasMedicas.vue";
import ListaPacientes from "../views/ListaPacientes.vue";
import Especialidades from "../views/Especialidades.vue";
import Doctores from "../views/Doctores.vue";
import HistorialClinico from "../views/HistorialClinico.vue"; 
import CertificadoMedico from "../views/CertificadoMedico.vue";  
import VerificarCorreo from "../views/VerificarCorreo.vue"; 


const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: ECommerceView,
    meta: {
      requiresAuth: true,
      title: 'eCommerce Dashboard',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
  {
    path: '/calendar',
    name: 'Calendario',
    component: CalendarView,
    meta: {
      requiresAuth: true,
      title: 'Calendario',
       roles: ['administrador', 'medico']
    }
  },
// {
//   path: '/whatsApp',
//   name: 'WhatsApp',
//   component: BotonWhatsApp,
//   meta: {
//     requiresAuth: true,
//     title: 'WhatsApp',
//      roles: ['administrador', 'medico']
//   }
// },
  {
    path: '/citas',
    name: 'Citas',
    component: Citas,
    meta: {
      requiresAuth: true,
      title: 'Citas',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
  {
    path: '/pacientes',
    name: 'Pacientes',
    component: Pacientes,
    meta: {
      requiresAuth: true,
      title: 'Pacientes',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
  {
    path: '/facturas',
    name: 'Facturas',
    component: Facturas,
    meta: {
      requiresAuth: true,
      title: 'Facturas',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
   {
    path: '/ListaCitasMedicas',
    name: 'ListaCitasMedicas',
    component: ListaCitasMedicas,
    meta: {
      requiresAuth: true,
      title: 'Lista Citas Medicas',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
  {
    path: '/ListaPacientes',
    name: 'ListaPacientes',
    component: ListaPacientes,
    meta: {
      requiresAuth: true,
      title: 'Lista Pacientes',
      roles: ['administrador', 'medico', 'enfermero(a)']
    }
  },
  {
    path: '/especialidades',
    name: 'Especialidades',
    component: Especialidades,
    meta: {
      requiresAuth: true,
      title: 'Ingreso Especialidades',
      roles: ['administrador']
    }
  },
  {
    path: '/doctores',
    name: 'Doctores',
    component: Doctores,
    meta: {
      requiresAuth: true,
      title: 'Ingreso Doctores',
      roles: ['administrador']
    }
  },
  {
    path: '/historialClinico',
    name: 'HistorialClinico',
    component: HistorialClinico,
    meta: {
      requiresAuth: true,
      title: 'Ver Historial Clinico',
      roles: ['administrador', 'medico']
    }
  },

  {
    path: '/certificadoMedico',
    name: 'CertificadoMedico',
    component: CertificadoMedico,
    meta: {
      requiresAuth: true,
      title: 'Certificacion Medica',
      roles: ['administrador', 'medico']
    }
  },

  {
  path: "/verificar",
  name: "VerificarCorreo",
   component: VerificarCorreo,
    meta: {
      title: 'VerificarCorreo'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");

  const rol = (localStorage.getItem("rol") || '')
  .replace(/"/g, '')
  .trim()
  .toLowerCase()

  // 🔒 Si requiere login
  if (to.meta.requiresAuth && !token) {
    return next({ name: "Login" })
  }

  // 🔒 Control de roles
  if (to.meta.roles && token) {
    const allowedRoles = (to.meta.roles as string[]).map(r =>
      r.toLowerCase()
    )

    if (!allowedRoles.includes(rol)) {
      return next({ name: "Login" }) // o /403
    }
  }

  next()
})

export default router
