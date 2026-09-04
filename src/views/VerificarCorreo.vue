<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const mensaje = ref("Verificando correo...");
const error = ref(false);

const API = import.meta.env.VITE_API_URL;

onMounted(async () => {

  const email = route.query.email;
  const codigo = route.query.codigo;

  try {

    const res = await axios.post(
      `${API}/Auth/VerificarCorreo`,
      {
        email,
        codigo,
      }
    );

    mensaje.value = res.data.message;

    setTimeout(() => {
      router.push("/");
    }, 3000);

  } catch (err: any) {

    error.value = true;

    mensaje.value =
      err.response?.data?.message ||
      "No se pudo verificar el correo";
  }
});
</script>

<template>

  <div class="verify-container">

    <div class="verify-card">

      <h2 v-if="!error">
        ✅ {{ mensaje }}
      </h2>

      <h2 v-else>
        ❌ {{ mensaje }}
      </h2>

      <p>Redirigiendo al login...</p>

    </div>

  </div>

</template>

<style scoped>

.verify-container{
  min-height:100vh;
  display:flex;
  justify-content:center;
  align-items:center;
  background:#f5f7fb;
}

.verify-card{
  background:white;
  padding:40px;
  border-radius:20px;
  box-shadow:0 10px 30px rgba(0,0,0,.1);
  text-align:center;
  max-width:400px;
}

</style>
