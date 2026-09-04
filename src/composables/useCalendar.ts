
import { computed, ref } from 'vue'

export const useCalendar = () => {

  const today = new Date()

  const selectedMonth = ref(today.getMonth())
  const selectedYear = ref(today.getFullYear())

  const getDaysInMonth = (year: number, month: number) => {

    const date = new Date(year, month, 1)

    const arr: { date: number; key: string }[] = []

    for (let i = 0; i < date.getDay(); i++) {
      arr.push({ date: 0, key: '' })
    }

    while (date.getMonth() === month) {

      const key =
        `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      arr.push({
        date: date.getDate(),
        key
      })

      date.setDate(date.getDate() + 1)
    }

    return arr
  }

  const calendarDays = computed(() =>
    getDaysInMonth(selectedYear.value, selectedMonth.value)
  )

  const nextMonth = () => {

    if (selectedMonth.value === 11) {
      selectedMonth.value = 0
      selectedYear.value++
    } else {
      selectedMonth.value++
    }
  }

  const prevMonth = () => {

    if (selectedMonth.value === 0) {
      selectedMonth.value = 11
      selectedYear.value--
    } else {
      selectedMonth.value--
    }
  }

  const isToday = (dayKey: string) => {

    if (!dayKey) return false

    const [y, m, d] = dayKey.split('-').map(Number)

    return (
      y === today.getFullYear() &&
      m - 1 === today.getMonth() &&
      d === today.getDate()
    )
  }

  return {
    selectedMonth,
    selectedYear,
    calendarDays,
    nextMonth,
    prevMonth,
    isToday
  }
}
