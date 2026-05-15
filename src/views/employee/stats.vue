<template>
  <div class="employee-stats">
    <div class="section-title">今日数据</div>
    <div class="today-cards">
      <div class="stat-card">
        <div class="stat-value">{{ dashboardData.todayOrders ?? 0 }}</div>
        <div class="stat-label">今日接单</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">¥{{ (dashboardData.todayRevenue ?? 0).toFixed(2) }}</div>
        <div class="stat-label">今日收入</div>
      </div>
    </div>

    <div class="section-title">本月趋势</div>
    <div ref="trendChartRef" style="height: 220px; margin: 0 12px;"></div>

    <div class="section-title">累计统计</div>
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-value">{{ rankData.completedOrders ?? 0 }}</div>
        <div class="summary-label">总接单量</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ rankData.avgRating ?? 0 }}</div>
        <div class="summary-label">平均评分</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ rankData.totalServiceHours ?? 0 }}h</div>
        <div class="summary-label">服务时长</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">¥{{ (rankData.totalRevenue ?? 0).toFixed(0) }}</div>
        <div class="summary-label">累计收入</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useECharts } from '@/utils/echarts'
import { getDashboard, getEmployeeTrend, getEmployeeRanking } from '@/api/stats'

const trendChartRef = ref(null)
const { setOption: setTrendChart } = useECharts(trendChartRef)

const dashboardData = ref({})
const rankData = ref({})

function loadData() {
  getDashboard().then(res => { dashboardData.value = res.data })

  const end = new Date().toISOString().slice(0, 10)
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  getEmployeeTrend({ startDate: start, endDate: end, groupBy: 'day' }).then(res => {
    setTrendChart({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: res.data.labels, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: '接单量', data: (res.data.current || []).map(i => i.orderCount),
        type: 'bar', barMaxWidth: 16, itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] }
      }],
      grid: { left: 30, right: 10, top: 10, bottom: 20 }
    })
  })

  getEmployeeRanking({ sortBy: 'orders', limit: 1 }).then(res => {
    if (res.data.items?.length > 0) {
      rankData.value = res.data.items[0]
    }
  })
}

onMounted(() => { loadData() })
</script>

<style scoped>
.employee-stats {
  padding: 16px;
  padding-bottom: 80px;
  min-height: 100dvh;
  background: #f5f7fa;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 12px;
}
.today-cards {
  display: flex;
  gap: 12px;
}
.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.stat-value { font-size: 24px; font-weight: 700; color: #1e3c72; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }

.summary-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.summary-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.summary-value { font-size: 20px; font-weight: 600; color: #303133; }
.summary-label { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
