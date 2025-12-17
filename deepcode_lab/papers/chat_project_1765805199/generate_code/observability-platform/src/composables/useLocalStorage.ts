/**
 * useLocalStorage Composable
 * 
 * Provides a reactive wrapper around localStorage with:
 * - Type-safe storage operations
 * - Automatic JSON serialization/deserialization
 * - Reactive state synchronization
 * - Error handling and fallback values
 * - Storage event listening for cross-tab synchronization
 * - Expiration support for time-limited data
 */

import { ref, watch, type Ref } from 'vue'

/**
 * Storage options configuration
 */
export interface UseLocalStorageOptions<T> {
  /**
   * Default value if key doesn't exist
   */
  defaultValue?: T
  
  /**
   * Custom serializer function
   */
  serializer?: (value: T) => string
  
  /**
   * Custom deserializer function
   */
  deserializer?: (value: string) => T
  
  /**
   * Listen to storage events from other tabs
   */
  listenToStorageEvents?: boolean
  
  /**
   * Expiration time in milliseconds (optional)
   */
  expirationMs?: number
  
  /**
   * Callback when value changes
   */
  onError?: (error: Error) => void
}

/**
 * Storage item with metadata
 */
interface StorageItem<T> {
  value: T
  timestamp: number
  expiresAt?: number
}

/**
 * Default JSON serializer
 */
const defaultSerializer = <T>(value: T): string => {
  return JSON.stringify(value)
}

/**
 * Default JSON deserializer
 */
const defaultDeserializer = <T>(value: string): T => {
  return JSON.parse(value)
}

/**
 * Check if localStorage is available
 */
const isLocalStorageAvailable = (): boolean => {
  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * useLocalStorage Composable
 * 
 * Creates a reactive ref that syncs with localStorage
 * 
 * @param key - Storage key
 * @param initialValue - Initial value if key doesn't exist
 * @param options - Configuration options
 * @returns Reactive ref synced with localStorage
 * 
 * @example
 * ```ts
 * const theme = useLocalStorage('theme', 'dark')
 * theme.value = 'light' // Automatically saves to localStorage
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): Ref<T> {
  const {
    defaultValue = initialValue,
    serializer = defaultSerializer,
    deserializer = defaultDeserializer,
    listenToStorageEvents = true,
    expirationMs,
    onError
  } = options

  // Check if localStorage is available
  const storageAvailable = isLocalStorageAvailable()

  /**
   * Read value from localStorage
   */
  const readValue = (): T => {
    if (!storageAvailable) {
      return defaultValue
    }

    try {
      const raw = localStorage.getItem(key)
      
      if (raw === null) {
        return defaultValue
      }

      // Parse storage item with metadata
      const item: StorageItem<T> = JSON.parse(raw)
      
      // Check expiration
      if (item.expiresAt && Date.now() > item.expiresAt) {
        localStorage.removeItem(key)
        return defaultValue
      }

      // Deserialize value
      return deserializer(JSON.stringify(item.value))
    } catch (error) {
      if (onError) {
        onError(error as Error)
      }
      return defaultValue
    }
  }

  /**
   * Write value to localStorage
   */
  const writeValue = (value: T): void => {
    if (!storageAvailable) {
      return
    }

    try {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiresAt: expirationMs ? Date.now() + expirationMs : undefined
      }

      const serialized = JSON.stringify(item)
      localStorage.setItem(key, serialized)
    } catch (error) {
      if (onError) {
        onError(error as Error)
      }
    }
  }

  // Create reactive ref
  const data = ref<T>(readValue()) as Ref<T>

  // Watch for changes and sync to localStorage
  watch(
    data,
    (newValue) => {
      writeValue(newValue)
    },
    { deep: true }
  )

  // Listen to storage events from other tabs
  if (storageAvailable && listenToStorageEvents) {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const item: StorageItem<T> = JSON.parse(event.newValue)
          
          // Check expiration
          if (item.expiresAt && Date.now() > item.expiresAt) {
            data.value = defaultValue
            return
          }

          data.value = deserializer(JSON.stringify(item.value))
        } catch (error) {
          if (onError) {
            onError(error as Error)
          }
        }
      } else if (event.key === key && event.newValue === null) {
        data.value = defaultValue
      }
    }

    window.addEventListener('storage', handleStorageChange)
  }

  return data
}

/**
 * Remove item from localStorage
 */
export function removeLocalStorageItem(key: string): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Failed to remove localStorage item: ${key}`, error)
  }
}

/**
 * Clear all items from localStorage
 */
export function clearLocalStorage(): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.clear()
  } catch (error) {
    console.error('Failed to clear localStorage', error)
  }
}

/**
 * Get all keys from localStorage
 */
export function getLocalStorageKeys(): string[] {
  if (!isLocalStorageAvailable()) {
    return []
  }

  try {
    return Object.keys(localStorage)
  } catch (error) {
    console.error('Failed to get localStorage keys', error)
    return []
  }
}

/**
 * Get localStorage size in bytes
 */
export function getLocalStorageSize(): number {
  if (!isLocalStorageAvailable()) {
    return 0
  }

  try {
    let size = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += localStorage[key].length + key.length
      }
    }
    return size
  } catch (error) {
    console.error('Failed to calculate localStorage size', error)
    return 0
  }
}

/**
 * Check if localStorage has a key
 */
export function hasLocalStorageItem(key: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false
  }

  try {
    return localStorage.getItem(key) !== null
  } catch (error) {
    console.error(`Failed to check localStorage item: ${key}`, error)
    return false
  }
}

/**
 * Get raw value from localStorage without deserialization
 */
export function getRawLocalStorageItem(key: string): string | null {
  if (!isLocalStorageAvailable()) {
    return null
  }

  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Failed to get localStorage item: ${key}`, error)
    return null
  }
}

/**
 * Set raw value to localStorage without serialization
 */
export function setRawLocalStorageItem(key: string, value: string): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.error(`Failed to set localStorage item: ${key}`, error)
  }
}

/**
 * Batch operations for localStorage
 */
export const localStorageBatch = {
  /**
   * Get multiple items at once
   */
  getItems<T = any>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    
    for (const key of keys) {
      const raw = getRawLocalStorageItem(key)
      if (raw) {
        try {
          const item: StorageItem<T> = JSON.parse(raw)
          
          // Check expiration
          if (item.expiresAt && Date.now() > item.expiresAt) {
            result[key] = null
            removeLocalStorageItem(key)
          } else {
            result[key] = item.value
          }
        } catch {
          result[key] = null
        }
      } else {
        result[key] = null
      }
    }
    
    return result
  },

  /**
   * Set multiple items at once
   */
  setItems<T = any>(items: Record<string, T>, expirationMs?: number): void {
    for (const [key, value] of Object.entries(items)) {
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiresAt: expirationMs ? Date.now() + expirationMs : undefined
      }
      setRawLocalStorageItem(key, JSON.stringify(item))
    }
  },

  /**
   * Remove multiple items at once
   */
  removeItems(keys: string[]): void {
    for (const key of keys) {
      removeLocalStorageItem(key)
    }
  }
}

/**
 * Clean up expired items from localStorage
 */
export function cleanupExpiredItems(): number {
  if (!isLocalStorageAvailable()) {
    return 0
  }

  let cleanedCount = 0
  const now = Date.now()

  try {
    const keys = Object.keys(localStorage)
    
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) {
        try {
          const item: StorageItem<any> = JSON.parse(raw)
          
          if (item.expiresAt && now > item.expiresAt) {
            localStorage.removeItem(key)
            cleanedCount++
          }
        } catch {
          // Skip invalid items
        }
      }
    }
  } catch (error) {
    console.error('Failed to cleanup expired items', error)
  }

  return cleanedCount
}

/**
 * Export all localStorage data
 */
export function exportLocalStorage(): Record<string, any> {
  if (!isLocalStorageAvailable()) {
    return {}
  }

  const data: Record<string, any> = {}

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const raw = localStorage.getItem(key)
        if (raw) {
          try {
            data[key] = JSON.parse(raw)
          } catch {
            data[key] = raw
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to export localStorage', error)
  }

  return data
}

/**
 * Import data to localStorage
 */
export function importLocalStorage(data: Record<string, any>): void {
  if (!isLocalStorageAvailable()) {
    return
  }

  try {
    for (const [key, value] of Object.entries(data)) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, serialized)
    }
  } catch (error) {
    console.error('Failed to import localStorage', error)
  }
}
