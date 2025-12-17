/**
 * Safe localStorage wrapper with JSON serialization, TTL support, and error handling
 * Provides type-safe operations for persisting application state
 */

/**
 * Internal storage format with optional expiration timestamp
 */
interface StorageItem<T> {
  value: T
  expiresAt?: number
}

/**
 * Configuration options for storage operations
 */
interface StorageOptions {
  expires?: number // Expiration time in milliseconds
  sync?: boolean // Enable cross-tab synchronization
}

/**
 * Check if localStorage is available (handles private browsing mode)
 */
function checkLocalStorageAvailable(): boolean {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

/**
 * Save object to localStorage with optional expiration
 * @param key Storage key
 * @param value Value to store
 * @param expires Expiration time in milliseconds (optional)
 * @returns Success indicator
 */
export function saveToLocalStorage<T>(
  key: string,
  value: T,
  expires?: number
): boolean {
  if (!checkLocalStorageAvailable()) {
    console.warn('localStorage not available')
    return false
  }

  try {
    const item: StorageItem<T> = {
      value,
      expiresAt: expires ? Date.now() + expires : undefined
    }
    localStorage.setItem(key, JSON.stringify(item))
    return true
  } catch (e) {
    if (e instanceof DOMException && e.code === 22) {
      console.error('localStorage quota exceeded')
    } else {
      console.error('Failed to save to localStorage:', e)
    }
    return false
  }
}

/**
 * Load object from localStorage with expiration checking
 * @param key Storage key
 * @param defaultValue Default value if key not found or expired
 * @returns Stored value or default
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (!checkLocalStorageAvailable()) {
    return defaultValue
  }

  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return defaultValue
    }

    const item: StorageItem<T> = JSON.parse(stored)

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      localStorage.removeItem(key)
      return defaultValue
    }

    return item.value
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return defaultValue
  }
}

/**
 * Remove specific key from localStorage
 * @param key Storage key
 * @returns Success indicator
 */
export function removeFromLocalStorage(key: string): boolean {
  if (!checkLocalStorageAvailable()) {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (e) {
    console.error('Failed to remove from localStorage:', e)
    return false
  }
}

/**
 * Clear all localStorage
 * @returns Success indicator
 */
export function clearLocalStorage(): boolean {
  if (!checkLocalStorageAvailable()) {
    return false
  }

  try {
    localStorage.clear()
    return true
  } catch (e) {
    console.error('Failed to clear localStorage:', e)
    return false
  }
}

/**
 * Get all localStorage keys
 * @returns Array of storage keys
 */
export function getLocalStorageKeys(): string[] {
  if (!checkLocalStorageAvailable()) {
    return []
  }

  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        keys.push(key)
      }
    }
    return keys
  } catch (e) {
    console.error('Failed to get localStorage keys:', e)
    return []
  }
}

/**
 * Calculate total localStorage usage in bytes
 * @returns Total bytes used
 */
export function getLocalStorageSize(): number {
  if (!checkLocalStorageAvailable()) {
    return 0
  }

  try {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          total += key.length + value.length
        }
      }
    }
    return total
  } catch (e) {
    console.error('Failed to calculate localStorage size:', e)
    return 0
  }
}

/**
 * Check if key exists and is not expired
 * @param key Storage key
 * @returns True if key exists and is valid
 */
export function hasLocalStorageKey(key: string): boolean {
  if (!checkLocalStorageAvailable()) {
    return false
  }

  try {
    const stored = localStorage.getItem(key)
    if (!stored) {
      return false
    }

    const item: StorageItem<any> = JSON.parse(stored)

    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      localStorage.removeItem(key)
      return false
    }

    return true
  } catch (e) {
    return false
  }
}

/**
 * Vue 3 Composable for reactive localStorage binding
 * @param key Storage key
 * @param initialValue Initial value if key not found
 * @param options Storage options (expires, sync)
 * @returns Reactive ref and methods
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageOptions
) {
  const { ref, computed, watch, onUnmounted } = require('vue')

  // Load initial value from storage
  const data = ref<T>(loadFromLocalStorage(key, initialValue))

  // Setter method
  const setData = (value: T): boolean => {
    data.value = value
    return saveToLocalStorage(key, value, options?.expires)
  }

  // Remover method
  const removeData = (): boolean => {
    data.value = initialValue
    return removeFromLocalStorage(key)
  }

  // Clear method
  const clear = (): boolean => {
    data.value = initialValue
    return removeFromLocalStorage(key)
  }

  // Watch for changes and persist
  watch(
    () => data.value,
    (newValue) => {
      saveToLocalStorage(key, newValue, options?.expires)
    },
    { deep: true }
  )

  // Cross-tab synchronization
  if (options?.sync) {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const item: StorageItem<T> = JSON.parse(event.newValue)
          data.value = item.value
        } catch (e) {
          console.error('Failed to sync storage change:', e)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange)
    })
  }

  return {
    data,
    setData,
    removeData,
    clear,
    isAvailable: checkLocalStorageAvailable()
  }
}

export type { StorageItem, StorageOptions }
