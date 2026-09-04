// stores/user.ts
import { defineStore } from "pinia";

export interface User {
  nombre: string;
  email: string;
  rol: string;
  token: string;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
  }),

  actions: {
    setUser(userData: User) {
      this.user = userData;
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
    },

    clearUser() {
      this.user = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});