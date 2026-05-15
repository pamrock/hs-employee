import * as echarts from 'echarts'
import { onUnmounted } from 'vue'

export function useECharts(chartRef, initOptions = {}) {
  let chartInstance = null

  function getInstance() {
    if (!chartRef.value) return null
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value, null, {
        renderer: 'canvas',
        ...initOptions
      })
    }
    return chartInstance
  }

  function setOption(option) {
    const instance = getInstance()
    if (instance) {
      instance.setOption(option, true)
    }
  }

  function resize() {
    if (chartInstance) {
      chartInstance.resize()
    }
  }

  const onResize = () => resize()
  window.addEventListener('resize', onResize)

  onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  })

  return { getInstance, setOption, resize }
}
