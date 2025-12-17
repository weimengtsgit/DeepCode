/**
 * usePagination.ts
 * 
 * Reusable pagination composable for managing paginated data across the platform.
 * Supports both offset-based and cursor-based pagination patterns with reactive state.
 * 
 * Usage:
 *   const { currentPage, pageSize, totalItems, paginatedData, ... } = usePagination(data, 50)
 */

import { ref, computed, Ref } from 'vue'

/**
 * Pagination configuration options
 */
export interface PaginationOptions {
  initialPage?: number
  initialPageSize?: number
  maxPageSize?: number
  minPageSize?: number
}

/**
 * Pagination state and methods
 */
export interface PaginationState<T> {
  // State refs
  currentPage: Ref<number>
  pageSize: Ref<number>
  totalItems: Ref<number>
  
  // Computed properties
  totalPages: Ref<number>
  hasNextPage: Ref<boolean>
  hasPreviousPage: Ref<boolean>
  startIndex: Ref<number>
  endIndex: Ref<number>
  paginatedData: Ref<T[]>
  
  // Methods
  goToPage(page: number): void
  nextPage(): void
  previousPage(): void
  setPageSize(size: number): void
  setTotalItems(total: number): void
  reset(): void
  getPageInfo(): { page: number; pageSize: number; total: number; pages: number }
}

/**
 * Main pagination composable
 * 
 * @param data - Source data array to paginate
 * @param initialPageSize - Initial items per page (default: 10)
 * @param options - Additional configuration options
 * @returns Pagination state and methods
 */
export function usePagination<T>(
  data: Ref<T[]> | T[],
  initialPageSize: number = 10,
  options: PaginationOptions = {}
): PaginationState<T> {
  // Normalize data input (handle both Ref and plain array)
  const dataRef = Array.isArray(data) ? ref(data) : data

  // Configuration
  const {
    initialPage = 1,
    maxPageSize = 1000,
    minPageSize = 1
  } = options

  // State
  const currentPage = ref(Math.max(1, initialPage))
  const pageSize = ref(Math.max(minPageSize, Math.min(initialPageSize, maxPageSize)))
  const totalItems = ref(dataRef.value?.length || 0)

  // Computed properties
  const totalPages = computed(() => {
    return Math.ceil(totalItems.value / pageSize.value) || 1
  })

  const hasNextPage = computed(() => {
    return currentPage.value < totalPages.value
  })

  const hasPreviousPage = computed(() => {
    return currentPage.value > 1
  })

  const startIndex = computed(() => {
    return (currentPage.value - 1) * pageSize.value
  })

  const endIndex = computed(() => {
    return Math.min(startIndex.value + pageSize.value, totalItems.value)
  })

  const paginatedData = computed(() => {
    const start = startIndex.value
    const end = endIndex.value
    return dataRef.value?.slice(start, end) || []
  })

  // Methods
  const goToPage = (page: number): void => {
    const validPage = Math.max(1, Math.min(page, totalPages.value))
    currentPage.value = validPage
  }

  const nextPage = (): void => {
    if (hasNextPage.value) {
      currentPage.value++
    }
  }

  const previousPage = (): void => {
    if (hasPreviousPage.value) {
      currentPage.value--
    }
  }

  const setPageSize = (size: number): void => {
    const validSize = Math.max(minPageSize, Math.min(size, maxPageSize))
    pageSize.value = validSize
    // Reset to page 1 when page size changes
    currentPage.value = 1
  }

  const setTotalItems = (total: number): void => {
    totalItems.value = Math.max(0, total)
    // Ensure current page is still valid
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(1, totalPages.value)
    }
  }

  const reset = (): void => {
    currentPage.value = 1
    pageSize.value = initialPageSize
    totalItems.value = dataRef.value?.length || 0
  }

  const getPageInfo = () => ({
    page: currentPage.value,
    pageSize: pageSize.value,
    total: totalItems.value,
    pages: totalPages.value
  })

  return {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    setPageSize,
    setTotalItems,
    reset,
    getPageInfo
  }
}

/**
 * Cursor-based pagination composable for large datasets
 * 
 * @param data - Source data array
 * @param pageSize - Items per page
 * @param cursorField - Field to use as cursor (default: 'id')
 * @returns Cursor pagination state and methods
 */
export function useCursorPagination<T extends Record<string, any>>(
  data: Ref<T[]> | T[],
  pageSize: number = 10,
  cursorField: keyof T = 'id' as keyof T
) {
  const dataRef = Array.isArray(data) ? ref(data) : data

  const cursor = ref<any>(null)
  const direction = ref<'forward' | 'backward'>('forward')
  const pageHistory = ref<any[]>([])

  const currentPageData = computed(() => {
    if (!cursor.value) {
      // First page
      return dataRef.value?.slice(0, pageSize) || []
    }

    const cursorIndex = dataRef.value?.findIndex(
      item => item[cursorField] === cursor.value
    ) ?? -1

    if (cursorIndex === -1) {
      return []
    }

    if (direction.value === 'forward') {
      return dataRef.value?.slice(cursorIndex + 1, cursorIndex + 1 + pageSize) || []
    } else {
      return dataRef.value?.slice(Math.max(0, cursorIndex - pageSize), cursorIndex) || []
    }
  })

  const hasNextPage = computed(() => {
    if (!cursor.value) {
      return (dataRef.value?.length || 0) > pageSize
    }

    const cursorIndex = dataRef.value?.findIndex(
      item => item[cursorField] === cursor.value
    ) ?? -1

    return cursorIndex + 1 + pageSize < (dataRef.value?.length || 0)
  })

  const hasPreviousPage = computed(() => {
    return pageHistory.value.length > 0
  })

  const nextPage = (): void => {
    if (hasNextPage.value && currentPageData.value.length > 0) {
      pageHistory.value.push(cursor.value)
      cursor.value = currentPageData.value[currentPageData.value.length - 1][cursorField]
      direction.value = 'forward'
    }
  }

  const previousPage = (): void => {
    if (hasPreviousPage.value) {
      cursor.value = pageHistory.value.pop()
      direction.value = 'backward'
    }
  }

  const reset = (): void => {
    cursor.value = null
    direction.value = 'forward'
    pageHistory.value = []
  }

  return {
    cursor,
    direction,
    currentPageData,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    reset
  }
}

/**
 * Infinite scroll pagination composable
 * 
 * @param data - Source data array
 * @param pageSize - Items to load per scroll
 * @returns Infinite scroll state and methods
 */
export function useInfiniteScroll<T>(
  data: Ref<T[]> | T[],
  pageSize: number = 20
) {
  const dataRef = Array.isArray(data) ? ref(data) : data

  const loadedCount = ref(pageSize)
  const isLoading = ref(false)

  const visibleData = computed(() => {
    return dataRef.value?.slice(0, loadedCount.value) || []
  })

  const hasMore = computed(() => {
    return loadedCount.value < (dataRef.value?.length || 0)
  })

  const loadMore = async (): Promise<void> => {
    if (isLoading.value || !hasMore.value) {
      return
    }

    isLoading.value = true
    
    // Simulate async loading delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    loadedCount.value = Math.min(
      loadedCount.value + pageSize,
      dataRef.value?.length || 0
    )
    
    isLoading.value = false
  }

  const reset = (): void => {
    loadedCount.value = pageSize
    isLoading.value = false
  }

  return {
    visibleData,
    hasMore,
    isLoading,
    loadMore,
    reset,
    loadedCount
  }
}
