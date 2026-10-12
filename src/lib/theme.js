import { ref, watch } from 'vue'

const savedTheme = localStorage.getItem('yunyue_theme')
export const theme = ref(savedTheme === 'dark' ? 'dark' : 'light')

function applyTheme(value) {
  document.documentElement.dataset.theme = value
  document.documentElement.style.colorScheme = value
  localStorage.setItem('yunyue_theme', value)
}

applyTheme(theme.value)
watch(theme, applyTheme)
