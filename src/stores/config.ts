import { ref, watchEffect } from 'vue'

const CONFIG_KEY = 'vault_config'

const darkMode = ref(false)

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) {
      const config = JSON.parse(raw)
      darkMode.value = !!config.darkMode
    }
  } catch { /* ignore */ }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ darkMode: darkMode.value }))
  } catch { /* ignore */ }
}

loadFromStorage()

watchEffect(() => {
  if (darkMode.value) {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light')
  }
  saveToStorage()
})

export function useConfig() {
  function toggle(): void {
    darkMode.value = !darkMode.value
  }

  return {
    darkMode,
    toggle,
  }
}
