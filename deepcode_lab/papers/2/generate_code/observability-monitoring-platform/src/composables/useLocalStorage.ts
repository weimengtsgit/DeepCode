/**
 * useLocalStorage.ts
 * 
 * Composable for safe localStorage operations with error handling,
 * type safety, and automatic serialization/deserialization.
 * 
 * Provides:
 * - Type-safe get/set operations
 * - Automatic JSON serialization
 * - Error handling for quota exceeded
 * - Privacy mode detection
 * - Expiration support
 */

import { ref, Ref, watch } from 'vue'

/**
 * Storage item with optional expiration
 */
interface StorageItem<T> {
  value: T
  expiresAt?: number
}

/**
 * Options for storage operations
 */
interface StorageOptions {
  expires?: number // milliseconds
  sync?: boolean // sync across tabs
}

/**
 * Main composable for localStorage operations
 * 
 * @param key - localStorage key
 * @param initialValue - default value if key doesn't exist
 * @param options - storage options (expires, sync)
 * @returns reactive ref and methods for storage operations
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {}
): {
  data: Ref<T>
  setData: (value: T) => boolean
  removeData: () => boolean
  clear: () => boolean
  isAvailable: boolean
} {
  // Check if localStorage is available
  const isAvailable = checkLocalStorageAvailable()

  // Initialize reactive ref with stored value or initial value
  const data = ref<T>(
    isAvailable ? loadFromStorage<T>(key, initialValue) : initialValue
  ) as Ref<T>

  /**
   * Set data in localStorage and update ref
   */
  const setData = (value: T): boolean => {
    if (!isAvailable) {
      console.warn(`localStorage not available, storing in memory only`)
      data.value = value
      return false
    }

    try {
      const item: StorageItem<T> = {
        value,
        expiresAt: options.expires ? Date.now() + options.expires : undefined
      }
      localStorage.setItem(key, JSON.stringify(item))
      data.value = value
      return true
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        console.error(`localStorage quota exceeded for key: ${key}`)
      } else {
        console.error(`Failed to set localStorage item: ${key}`, error)
      }
      return false
    }
  }

  /**
   * Remove data from localStorage
   */
  const removeData = (): boolean => {
    if (!isAvailable) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Failed to remove localStorage item: ${key}`, error)
      return false
    }
  }

  /**
   * Clear all localStorage data
   */
  const clear = (): boolean => {
    if (!isAvailable) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error(`Failed to clear localStorage`, error)
      return false
    }
  }

  // Watch for external changes (from other tabs)
  if (options.sync && isAvailable) {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.newValue) {
        try {
          const item = JSON.parse(event.newValue) as StorageItem<T>
          if (!isExpired(item)) {
            data.value = item.value
          }
        } catch (error) {
          console.error(`Failed to sync storage from other tab: ${key}`, error)
        }
      }
    })
  }

  return {
    data,
    setData,
    removeData,
    clear,
    isAvailable
  }
}

/**
 * Load data from localStorage with expiration check
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue

    const parsed = JSON.parse(item) as StorageItem<T>

    // Check expiration
    if (isExpired(parsed)) {
      localStorage.removeItem(key)
      return defaultValue
    }

    return parsed.value
  } catch (error) {
    console.warn(`Failed to load from localStorage: ${key}`, error)
    return defaultValue
  }
}

/**
 * Check if storage item has expired
 */
function isExpired<T>(item: StorageItem<T>): boolean {
  if (!item.expiresAt) return false
  return Date.now() > item.expiresAt
}

/**
 * Check if localStorage is available
 * (handles private browsing mode where localStorage throws)
 */
function checkLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch (error) {
    console.warn('localStorage not available (possibly private browsing mode)')
    return false
  }
}

/**
 * Utility function to save object to localStorage
 * 
 * @param key - storage key
 * @param value - value to store
 * @param expires - optional expiration in milliseconds
 * @returns success boolean
 */
export function saveToLocalStorage<T>(
  key: string,
  value: T,
  expires?: number
): boolean {
  try {
    const item: StorageItem<T> = {
      value,
      expiresAt: expires ? Date.now() + expires : undefined
    }
    localStorage.setItem(key, JSON.stringify(item))
    return true
  } catch (error) {
    if (error instanceof DOMException && error.code === 22) {
      console.error(`localStorage quota exceeded for key: ${key}`)
    } else {
      console.error(`Failed to save to localStorage: ${key}`, error)
    }
    return false
  }
}

/**
 * Utility function to load object from localStorage
 * 
 * @param key - storage key
 * @param defaultValue - default if not found or expired
 * @returns stored value or default
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) return defaultValue

    const parsed = JSON.parse(item) as StorageItem<T>

    // Check expiration
    if (isExpired(parsed)) {
      localStorage.removeItem(key)
      return defaultValue
    }

    return parsed.value
  } catch (error) {
    console.warn(`Failed to load from localStorage: ${key}`, error)
    return defaultValue
  }
}

/**
 * Utility function to remove item from localStorage
 * 
 * @param key - storage key
 * @returns success boolean
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Failed to remove from localStorage: ${key}`, error)
    return false
  }
}

/**
 * Utility function to clear all localStorage
 * 
 * @returns success boolean
 */
export function clearLocalStorage(): boolean {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error(`Failed to clear localStorage`, error)
    return false
  }
}

/**
 * Utility function to get all keys from localStorage
 * 
 * @returns array of storage keys
 */
export function getLocalStorageKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    return keys
  } catch (error) {
    console.error(`Failed to get localStorage keys`, error)
    return []
  }
}

/**
 * Utility function to get localStorage size in bytes
 * 
 * @returns approximate size in bytes
 */
export function getLocalStorageSize(): number {
  try {
    let size = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key)
        if (value) {
          size += key.length + value.length
        }
      }
    }
    return size
  } catch (error) {
    console.error(`Failed to calculate localStorage size`, error)
    return 0
  }
}

/**
 * Utility function to check if key exists in localStorage
 * 
 * @param key - storage key
 * @returns true if key exists and not expired
 */
export function hasLocalStorageKey(key: string): boolean {
  try {
    const item = localStorage.getItem(key)
    if (!item) return false

    const parsed = JSON.parse(item) as StorageItem<any>
    return !isExpired(parsed)
  } catch (error) {
    return false
  }
}
