<template>
  <aside :class="['sidebar', { collapsed }]">
    <!-- LOGO -->
    <div class="sidebar__header">
      <span class="logo">🏥</span>
      <h2 v-if="!collapsed">Clínica</h2>
    </div>

    <!-- BOTÓN COLAPSAR -->
    <button class="collapse-btn" @click="collapsed = !collapsed">
      {{ collapsed ? '➡' : '⬅' }}
    </button>

    <!-- MENÚ -->
    <nav class="sidebar__nav">
      <router-link to="/dashboard" class="nav-item">
        🏠 <span v-if="!collapsed">Inicio</span>
      </router-link>

      <router-link to="/dashboard/citas" class="nav-item">
        📅 <span v-if="!collapsed">Citas</span>
      </router-link>

      <router-link to="/dashboard/doctores" class="nav-item">
        👨‍⚕️ <span v-if="!collapsed">Doctores</span>
      </router-link>

      <router-link to="/dashboard/pacientes" class="nav-item">
        🧑‍🤝‍🧑 <span v-if="!collapsed">Pacientes</span>
      </router-link>

      <router-link to="/dashboard/especialidades" class="nav-item">
        🏥 <span v-if="!collapsed">Especialidades</span>
      </router-link>

      <div v-if="user.user?.rol === 'Admin'" class="nav-section">
        <p v-if="!collapsed">Administración</p>
        <router-link to="/dashboard/roles" class="nav-item">
          🔐 <span v-if="!collapsed">Roles</span>
        </router-link>
        <router-link to="/dashboard/usuarios" class="nav-item">
          👥 <span v-if="!collapsed">Usuarios</span>
        </router-link>
      </div>

      <router-link to="/dashboard/facturas" class="nav-item">
        💳 <span v-if="!collapsed">Facturación</span>
      </router-link>
    </nav>

    <!-- FOOTER -->
    <div class="sidebar__footer">
      <button class="logout-btn" @click="logout">
        ⏻ <span v-if="!collapsed">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { useUserStore } from "@/stores/user";
import { useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const user = useUserStore();
    const router = useRouter();
    const collapsed = ref(false);

    const logout = () => {
      user.clearUser();        // ✅ usar clearUser en lugar de logout
      router.push("/Login");   // redirige al login
    };

    return { user, logout, collapsed };
  },
});
</script>

<style scoped>
/* SIDEBAR */
.sidebar {
  width: 260px;
  transition: width 0.3s;
  background: #1f2d3d;
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
}

.sidebar.collapsed {
  width: 80px;
  padding: 20px 10px;
}

/* HEADER */
.sidebar__header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 1.5rem;
}

/* BOTÓN COLAPSAR */
.collapse-btn {
  margin: 15px 0;
  background: none;
  border: none;
  color: #ecf0f1;
  cursor: pointer;
  font-size: 1.1rem;
  transition: 0.3s;
}

.collapse-btn:hover {
  color: #1abc9c;
}

/* NAV */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #ecf0f1;
  text-decoration: none;
  transition: 0.3s;
}

.nav-item:hover {
  background: #34495e;
}

.router-link-active {
  background: #1abc9c;
  color: white;
  font-weight: 500;
}

/* SECCIÓN ADMIN */
.nav-section p {
  font-size: 0.75rem;
  color: #95a5a6;
  margin: 5px 0;
}

/* FOOTER */
.sidebar__footer {
  margin-top: 20px;
}

.logout-btn {
  width: 100%;
  padding: 10px;
  background: #e74c3c;
  border: none;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
}

.logout-btn:hover {
  background: #c0392b;
}
</style>