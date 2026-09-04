
import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
// 🔹 Importaciones de vistas

import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import Citas from "../views/Citas.vue";
import Doctores from "../views/Doctores.vue";
import Pacientes from "../views/Pacientes.vue";
import Especialidades from "../views/Especialidades.vue";
import Roles from "../views/Roles.vue";
import Usuarios from "../views/Usuarios.vue";
import Facturas from "../views/Facturas.vue";


// 🔹 Definición de rutas
const routes: Array<RouteRecordRaw> = [
  { path: "/", name: "Login", component: Login },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: Dashboard,
    meta: { requiresAuth: true },
    children: [
      { path: "citas", name: "Citas", component: Citas },
      { path: "doctores", name: "Doctores", component: Doctores },
      { path: "pacientes", name: "Pacientes", component: Pacientes },
      { path: "especialidades", name: "Especialidades", component: Especialidades },
      { path: "roles", name: "Roles", component: Roles, meta: { roles: ["Admin"] } },
      { path: "usuarios", name: "Usuarios", component: Usuarios, meta: { roles: ["Admin"] } },
      { path: "facturas", name: "Facturas", component: Facturas },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" }, // Redirige rutas desconocidas a login
];

// 🔹 Creación del router
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 🔹 Protección de rutas (auth + roles)
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Rutas que requieren login
  if (to.meta.requiresAuth && !token) return next({ name: "Login" });

  // Solo checar roles si hay token
  if (to.meta.roles && token) {
    const allowedRoles: string[] = to.meta.roles as string[];
     if (!allowedRoles.includes(user.rol)) return next({ name: "/" });
    //if (!allowedRoles.includes(user.rol)) return next({ name: "Dashboard" });
  }

  next();
});

export default router;