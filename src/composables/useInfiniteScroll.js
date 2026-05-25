// src/composables/useInfiniteScroll.js
import { ref, onMounted, onUnmounted, watch } from 'vue'

export function useInfiniteScroll(loadMore, hasMore) {
  const sentinelRef = ref(null)
  let observer = null

  function setupObserver() {
    if (observer) observer.disconnect()
    if (!sentinelRef.value) return

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore.value) {
        loadMore()
      }
    }, { rootMargin: '100px' })

    observer.observe(sentinelRef.value)
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  watch(sentinelRef, () => {
    setupObserver()
  })

  return { sentinelRef }
}
