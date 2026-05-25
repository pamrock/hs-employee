// src/composables/usePullRefresh.js
import { ref } from 'vue'

export function usePullRefresh(onRefresh) {
  const pullState = ref('')   // '' | 'pulling' | 'ready' | 'loading'
  const pullDistance = ref(0)
  const TRIGGER_DIST = 60
  const MAX_DIST = 100

  let startY = 0
  let startScrollTop = 0

  function onTouchStart(e) {
    if (pullState.value === 'loading') return
    startY = e.touches[0].clientY
    startScrollTop = e.currentTarget.scrollTop
  }

  function onTouchMove(e) {
    if (pullState.value === 'loading') return
    if (startScrollTop > 0) {
      pullDistance.value = 0
      pullState.value = ''
      return
    }
    const delta = (e.touches[0].clientY - startY) * 0.5 // resistance factor
    if (delta <= 0) {
      pullDistance.value = 0
      pullState.value = ''
      return
    }
    e.preventDefault() // prevent only when pulling down
    pullDistance.value = Math.min(delta, MAX_DIST)
    pullState.value = pullDistance.value >= TRIGGER_DIST ? 'ready' : 'pulling'
  }

  function onTouchEnd(e) {
    if (pullState.value === 'ready') {
      pullState.value = 'loading'
      pullDistance.value = TRIGGER_DIST
      Promise.resolve(onRefresh()).finally(() => {
        pullState.value = ''
        pullDistance.value = 0
      })
    } else {
      pullState.value = ''
      pullDistance.value = 0
    }
  }

  return { pullState, pullDistance, onTouchStart, onTouchMove, onTouchEnd }
}
