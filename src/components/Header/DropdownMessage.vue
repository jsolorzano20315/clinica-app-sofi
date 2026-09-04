<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { ref } from 'vue'

const target = ref<HTMLElement | null>(null)
const dropdownOpen = ref<boolean>(false)
const notifying = ref<boolean>(true)

onClickOutside(target, () => {
  dropdownOpen.value = false
})

import userOne from '@/assets/images/user/user-01.png'
import userTwo from '@/assets/images/user/user-02.png'
import userThree from '@/assets/images/user/user-03.png'
import userFour from '@/assets/images/user/user-04.png'

interface Message {
  route: string
  userImg: string
  name: string
  message: string
  time: string
}

const messagesList = ref<Message[]>([
  {
    route: '#',
    userImg: userTwo,
    name: 'Mariya Desoja',
    message: 'I like your confidence 💪',
    time: '2min ago'
  },
  {
    route: '#',
    userImg: userOne,
    name: 'Robert Jhon',
    message: 'Can you share your offer?',
    time: '10min ago'
  },
  {
    route: '#',
    userImg: userThree,
    name: 'Henry Dholi',
    message: 'I cam across your profile and...',
    time: '1day ago'
  },
  {
    route: '#',
    userImg: userFour,
    name: 'Cody Fisher',
    message: 'I’m waiting for you response!',
    time: '5day ago'
  },
  {
    route: '#',
    userImg: userTwo,
    name: 'Mariya Desoja',
    message: 'I like your confidence 💪',
    time: '2min ago'
  }
])

const telefono: string = '50412345678'

const enviarWhatsApp = (nombre: string, mensaje: string): void => {
  const texto: string = `Hola ${nombre}, vi tu mensaje: "${mensaje}". Te respondo:`
  const url: string = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(texto)}`
  window.open(url, '_blank')
}
</script>

<template>
  <li class="relative" ref="target">
    <router-link
      class="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border-[0.5px] border-stroke bg-gray hover:text-primary dark:border-strokedark dark:bg-meta-4 dark:text-white"
      to="#"
      @click.prevent="(dropdownOpen = !dropdownOpen), (notifying = false)"
    >
      <span
        :class="!notifying && 'hidden'"
        class="absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-meta-1"
      ></span>

      <svg
        class="fill-current duration-300 ease-in-out"
        width="18"
        height="18"
        viewBox="0 0 18 18"
        fill="none"
      >
        <path
          d="M10.9688 1.57495H7.03135C3.43135 1.57495 0.506348 4.41558 0.506348 7.90308C0.506348 11.3906 2.75635 13.8375 8.26885 16.3125C8.40947 16.3687 8.52197 16.3968 8.6626 16.3968C8.85947 16.3968 9.02822 16.3406 9.19697 16.2281C9.47822 16.0593 9.64697 15.75 9.64697 15.4125V14.2031H10.9688C14.5688 14.2031 17.522 11.3625 17.522 7.87495C17.522 4.38745 14.5688 1.57495 10.9688 1.57495Z"
        />
      </svg>
    </router-link>

    <ul
      v-if="dropdownOpen"
      class="absolute right-0 mt-2 w-80 rounded bg-white shadow-lg dark:bg-boxdark"
    >
      <li
        v-for="(msg, index) in messagesList"
        :key="index"
        class="flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer"
        @click="enviarWhatsApp(msg.name, msg.message)"
      >
        <img :src="msg.userImg" class="h-10 w-10 rounded-full" />

        <div>
          <p class="text-sm font-semibold">{{ msg.name }}</p>
          <p class="text-xs text-gray-500">{{ msg.message }}</p>
        </div>
      </li>
    </ul>
  </li>
</template>