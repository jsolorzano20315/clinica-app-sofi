<script setup lang="ts">
import { ref } from 'vue'
// @ts-ignore
import VueApexCharts from 'vue3-apexcharts'

const chartData = {
  series: [
    {
      name: 'Product One',
      data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30, 45]
    },

    {
      name: 'Product Two',
      data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39, 51]
    }
  ],
  labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
}

const chart = ref(null)

const apexOptions = {
  legend: {
    show: false,
    position: 'top',
    horizontalAlign: 'left'
  },
  colors: ['#3C50E0', '#80CAEE'],
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    height: 335,
    type: 'area',
    dropShadow: {
      enabled: true,
      color: '#623CEA14',
      top: 10,
      blur: 4,
      left: 0,
      opacity: 0.1
    },

    toolbar: {
      show: false
    }
  },
  responsive: [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 300
        }
      }
    },
    {
      breakpoint: 1366,
      options: {
        chart: {
          height: 350
        }
      }
    }
  ],
  stroke: {
    width: [2, 2],
    curve: 'straight'
  },

  labels: {
    show: false,
    position: 'top'
  },
  grid: {
    xaxis: {
      lines: {
        show: true
      }
    },
    yaxis: {
      lines: {
        show: true
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  markers: {
    size: 4,
    colors: '#fff',
    strokeColors: ['#3056D3', '#80CAEE'],
    strokeWidth: 3,
    strokeOpacity: 0.9,
    strokeDashArray: 0,
    fillOpacity: 1,
    discrete: [],
    hover: {
      size: undefined,
      sizeOffset: 5
    }
  },
  xaxis: {
    type: 'category',
    categories: chartData.labels,
    axisBorder: {
      show: false
    },
    axisTicks: {
      show: false
    }
  },
  yaxis: {
    title: {
      style: {
        fontSize: '0px'
      }
    },
    min: 0,
    max: 100
  }
}
</script>

<template>
<div
class="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-20 pb-20 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-12 min-h-[500px]"
>
  <div class="mt-5">
    <div class="relative w-full h-[350px] overflow-hidden rounded-lg">

     <img src="https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1800&q=80" 
        class="absolute inset-0 w-full h-full object-cover object-center scale-105"/>

      <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

      <div class="absolute bottom-4 left-5 text-white drop-shadow-md max-w-sm">
          <h3 class="text-xl font-semibold">
            Plataforma Inteligente para Gestión Clínica
          </h3>
          <p class="text-sm text-blue-100">
             Automatización de citas, pacientes y expedientes médicos
          </p>
        </div>

    </div>
  </div>
</div>
</template>
