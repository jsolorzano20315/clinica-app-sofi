<script lang="ts">
import { defineComponent, ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useUserStore } from "../stores/user";
import medicalIcon from "../assets/images/Logo/Logo.svg";

export default defineComponent({
  name: "Login",

  setup() {
    // LOGIN
    const email = ref("");
    const password = ref("");
    const error = ref("");
    const loading = ref(false);

    // MODAL
    const mostrarModal = ref(false);

    // REGISTRO
    const nuevoEmail = ref("");
    const nuevoNombre = ref("");
    const nuevaClinica = ref("");
    const nuevoPassword = ref("");
    const confirmarnuevoPassword = ref("");
    const nuevoRol = ref("medico");

    const mostrarPassword = ref(false);

    const registroError = ref("");
    const registroExito = ref("");
    const loadingRegistro = ref(false);

    // VERIFICACIÓN
    const mostrarVerificacion = ref(false);
    const codigoVerificacion = ref("");
    const ocultarBotonVerificar = ref(false);

    const router = useRouter();
    const userStore = useUserStore();
    const API = import.meta.env.VITE_API_URL;

    const rolesPermitidos = ["administrador", "medico"];

    // VALIDACIONES
    const tieneMayuscula = computed(() => /[A-Z]/.test(nuevoPassword.value));
    const tieneMinuscula = computed(() => /[a-z]/.test(nuevoPassword.value));
    const tieneNumero = computed(() => /\d/.test(nuevoPassword.value));
    const tieneEspecial = computed(() => /[@$!%*?&.#_-]/.test(nuevoPassword.value));

    const emailValido = computed(() =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoEmail.value)
    );

    const passwordValida = computed(() =>
      tieneMayuscula.value &&
      tieneMinuscula.value &&
      tieneNumero.value &&
      tieneEspecial.value &&
      nuevoPassword.value.length >= 8
    );

    // LOGIN
    const login = async () => {
      error.value = "";

      if (!email.value || !password.value) {
        error.value = "Ingrese correo y contraseña.";
        return;
      }

      loading.value = true;

      try {
        const res = await axios.post(`${API}/Auth/login`, {
          email: email.value,
          password: password.value,
        });

        const userData = res.data;

        userStore.setUser(userData);

        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("clinica", userData.clinica);
        localStorage.setItem("email", userData.email);
        localStorage.setItem("rol", userData.rol);

        router.push("/dashboard");
      } catch {
        error.value = "Credenciales incorrectas o error de servidor.";
      } finally {
        loading.value = false;
      }
    };

    // REGISTRAR
    const registrarUsuario = async () => {
      registroError.value = "";
      registroExito.value = "";

      if (!rolesPermitidos.includes(nuevoRol.value)) {
        registroError.value = "Rol no permitido";
        return;
      }

      if (!emailValido.value) {
        registroError.value = "Email inválido";
        return;
      }

      if (
        !nuevoNombre.value ||
        !nuevoEmail.value ||
        !nuevaClinica.value ||
        !nuevoPassword.value ||
        !confirmarnuevoPassword.value
      ) {
        registroError.value = "Complete todos los campos";
        return;
      }

      if (!passwordValida.value) {
          registroError.value =
            "La contraseña no es segura. Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial.";
          return;
        }

      if (nuevoPassword.value !== confirmarnuevoPassword.value) {
        registroError.value = "Las contraseñas no coinciden";
        return;
      }

      loadingRegistro.value = true;

      try {
       await axios.post(`${API}/Auth/GuardarUsuarios`, {
          Nombre: nuevoNombre.value,
          Email: nuevoEmail.value,
          Password: nuevoPassword.value,
          Rol: nuevoRol.value,
          Clinica: nuevaClinica.value,
        });

        // 👉 MOSTRAR VERIFICACIÓN
        mostrarVerificacion.value = true;

        registroExito.value =
          // "Cuenta creada. Revisa tu correo para verificar tu cuenta.";
           "CUENTA CREADA CON EXITO.....";

      } catch (err: any) {
        registroError.value =
          err.response?.data?.message ||
          "Error al crear usuario";
      } finally {
        loadingRegistro.value = true;
      }
    };

    // VERIFICAR CÓDIGO
    const verificarCorreo = async () => {
      if (!codigoVerificacion.value) {
        registroError.value = "Ingrese el código";
        return;
      }

      try {
        const res = await axios.post(`${API}/Auth/VerificarCorreo`, {
          email: nuevoEmail.value,
          codigo: codigoVerificacion.value,
        });

        registroExito.value = res.data.message;
        ocultarBotonVerificar.value = true;
        codigoVerificacion.value = "";

       setTimeout(() => {
          cerrarModal();
        }, 5000);

      } catch (err: any) {
        registroError.value =
          err.response?.data?.message || "Código inválido";
      }
    };

    // CERRAR MODAL
    const cerrarModal = () => {
      mostrarModal.value = false;
      mostrarVerificacion.value = false;

      nuevoEmail.value = "";
      nuevoNombre.value = "";
      nuevaClinica.value = "";
      nuevoPassword.value = "";
      confirmarnuevoPassword.value = "";
      codigoVerificacion.value = "";

      registroError.value = "";
      registroExito.value = "";
    };


    return {
      email,
      password,
      login,
      error,
      loading,
      medicalIcon,

      mostrarModal,
      cerrarModal,

      nuevoEmail,
      nuevoNombre,
      nuevaClinica,
      nuevoPassword,
      confirmarnuevoPassword,
      nuevoRol,
      mostrarPassword,

      registrarUsuario,
      registroError,
      registroExito,
      loadingRegistro,

      mostrarVerificacion,
      codigoVerificacion,
      verificarCorreo,

      tieneMayuscula,
      tieneMinuscula,
      tieneNumero,
      tieneEspecial,
      emailValido,
      passwordValida,
    };
  },
});
</script>

<template>
  <div class="login-container">

    <div class="login-card">

      <!-- LOGO -->
      <img :src="medicalIcon" alt="Clínica" class="login-icon" />

      <h2>Iniciar Sesión</h2>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- LOGIN -->
      <form @submit.prevent="login" class="login-form">

        <div class="form-group">
          <label>Correo electrónico</label>
          <input
            v-model="email"
            type="email"
            placeholder="usuario@correo.com"
            required
          />
        </div>

        <div class="form-group">
        <label>Contraseña</label>

        <div class="password-box">
          <input
            v-model="password"
            :type="mostrarPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
          />

          <button
              type="button"
              class="btn-show"
              @click="mostrarPassword = !mostrarPassword"
            >
              <span v-if="mostrarPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
        </div>
      </div>

        <button type="submit" :disabled="loading">
          <span v-if="loading" class="loader"></span>
          <span v-else>Ingresar</span>
        </button>

      </form>

      <!-- ABRIR MODAL -->
      <div class="register-link">
        ¿No tienes cuenta?
        <span @click="mostrarModal = true">
          Crear nueva cuenta
        </span>
      </div>

    </div>

    <!-- MODAL -->
    <div v-if="mostrarModal" class="modal-overlay">

      <div class="modal-card">

        <h3>Crear Cuenta</h3>

        <!-- MENSAJES -->
        <div v-if="registroError" class="error-message">
          {{ registroError }}
        </div>

        <div v-if="registroExito" class="success-message">
          {{ registroExito }}
        </div>

        <!-- ========================= -->
        <!-- FORMULARIO REGISTRO -->
        <!-- ========================= -->
        <form
          v-if="!mostrarVerificacion"
          @submit.prevent="registrarUsuario"
        >

          <div class="form-group">
            <label>Nombre completo</label>
            <input v-model.trim="nuevoNombre" type="text" required />
          </div>

          <div class="form-group">
            <label>Nombre de la clínica</label>
            <input v-model.trim="nuevaClinica" type="text" required />
          </div>

          <div class="form-group">
            <label>Correo electrónico</label>
            <input v-model.trim="nuevoEmail" type="email" required />
          </div>

          <div class="form-group">
          <label>Contraseña</label>

          <div class="password-box">
            <input
              v-model="nuevoPassword"
              :type="mostrarPassword ? 'text' : 'password'"
              required
              placeholder="••••••••"
            />

            <button
              type="button"
              class="btn-show"
              @click="mostrarPassword = !mostrarPassword"
            >
              <span v-if="mostrarPassword">🙈</span>
              <span v-else>👁️</span>
            </button>
          </div>
        </div>

          <div class="form-group">
            <label>Confirmar contraseña</label>
            <input v-model="confirmarnuevoPassword" type="password" required />
          </div>

          <div class="modal-buttons">
            <button type="submit">
              Crear Cuenta
            </button>

            <button type="button" class="btn-cancelar" @click="cerrarModal">
              Cancelar
            </button>
          </div>

        </form>

        <!-- ========================= -->
        <!-- VERIFICACIÓN CORREO -->
        <!-- ========================= -->
        <div v-else class="verificacion-box">

         <!-- <div class="form-group">
            <label>Código de verificación</label>

            <input
              v-model="codigoVerificacion"
              type="text"
              placeholder="Ingrese el código"
            />
          </div>-->

          <div class="modal-buttons">

           <!--  <button type="button" @click="verificarCorreo">
              Verificar correo
            </button>-->

            <button
              type="button"
              class="btn-cancelar"
              @click="cerrarModal"
            >
              Aceptar
            </button>

          </div>

        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>

/* CONTENEDOR */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background:
    linear-gradient(
      135deg,
      #e0f7fa,
      #e1f5fe
    );
}

/* CARD */
.login-card {
  background: white;
  padding: 3rem 2rem;
  border-radius: 24px;
  width: 100%;
  max-width: 420px;
  box-shadow:
    0 10px 30px rgba(0,0,0,0.08);
  text-align: center;
}

.login-icon {
  width: 100px;
  margin: auto;
  margin-bottom: 1rem;
}

.login-card h2 {
  color: #0288d1;
  margin-bottom: 2rem;
}

/* FORM */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.2rem;
  text-align: left;
}

.form-group label {
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 600;
}

.form-group input {
  padding: 0.95rem;
  border-radius: 12px;
  border: 1px solid #ccc;
  transition: 0.2s;
  font-size: 0.95rem;
}

.form-group select {
  padding: 0.95rem;
  border-radius: 12px;
  border: 1px solid #ccc;
  transition: 0.2s;
  font-size: 0.95rem;
  background: white;
}

.form-group input:focus {
  border-color: #0288d1;
  outline: none;
  box-shadow:
    0 0 6px rgba(2,136,209,0.2);
}

.form-group select:focus {
  border-color: #0288d1;
  outline: none;
  box-shadow:
    0 0 6px rgba(2,136,209,0.2);
}

/* BUTTON */
button {
  width: 100%;
  padding: 0.95rem;
  border: none;
  border-radius: 12px;
  background: #0288d1;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

button:hover {
  background: #0277bd;
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* LINK */
.register-link {
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #666;
}

.register-link span {
  color: #0288d1;
  font-weight: bold;
  cursor: pointer;
  margin-left: 5px;
}

.register-link span:hover {
  text-decoration: underline;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 20px;
}

.modal-card {
  background: white;
  width: 100%;
  max-width: 430px;
  padding: 2rem;
  border-radius: 24px;
  animation: fadeIn 0.25s ease;
}

.modal-card h3 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #0288d1;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
}

.btn-cancelar {
  background: #ef5350;
}

.btn-cancelar:hover {
  background: #e53935;
}

/* MENSAJES */
.error-message {
  background: #ffcdd2;
  color: #c62828;
  padding: 0.8rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.success-message {
  background: #c8e6c9;
  color: #2e7d32;
  padding: 0.8rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

/* PASSWORD */
.password-box {
  position: relative;
  display: flex;
  align-items: center;
}

.password-box input {
  width: 100%;
  padding-right: 90px;
}

.btn-show {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: #0288d1;
  font-size: 0.85rem;
  cursor: pointer;
  width: auto;
  padding: 0;
  font-weight: bold;
}

.btn-show:hover {
  background: transparent;
  color: #0277bd;
}

.password-strength {
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 10px;
}

.strength-bar {
  height: 100%;
  transition: 0.3s ease;
}

.weak {
  width: 33%;
  background: #ef5350;
}

.medium {
  width: 66%;
  background: #ffb300;
}

.strong {
  width: 100%;
  background: #43a047;
}

.password-rules {
  margin-top: 10px;
  padding-left: 18px;
  font-size: 0.85rem;
  color: #777;
}

.password-rules li {
  margin-bottom: 4px;
}

.password-rules .valid {
  color: #43a047;
  font-weight: 600;
}

.success {
  color: #2e7d32;
  font-weight: 600;
}

.error-text {
  color: #d32f2f;
  font-weight: 600;
}

.text-red {
  color: #d32f2f;
}

.text-yellow {
  color: #f9a825;
}

.text-green {
  color: #2e7d32;
}

/* LOADER */
.loader {
  width: 18px;
  height: 18px;
  border: 3px solid white;
  border-top: 3px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {

  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* RESPONSIVE */
@media (max-width: 480px) {

  .login-card,
  .modal-card {
    padding: 1.5rem;
  }

  .modal-buttons {
    flex-direction: column;
  }
}

</style>
