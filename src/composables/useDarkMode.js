// src/composables/useDarkMode.js
import { ref } from 'vue'

const STORAGE_KEY = 'theme'

export function useDarkMode() {
  const isDark = ref(false)

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    isDark.value = theme === 'dark'
  }

  function toggle() {
    const newTheme = isDark.value ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  })

  applyTheme(getPreferredTheme())

  return { isDark, toggle }
}
