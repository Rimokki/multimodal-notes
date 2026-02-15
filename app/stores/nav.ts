import { ref } from 'vue'

export const useNavStore = defineStore('nav', () => {
  const activeIndex = ref('0')
  const isCollapse = ref(false)

  const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value
  }

  return { activeIndex, isCollapse, toggleCollapse }
})
