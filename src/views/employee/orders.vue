<template>
  <div class="orders-container">
    <div class="header">
      <h2>员工订单</h2>
    </div>

    <div ref="tabsRef" class="status-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-item"
        :class="{ active: activeTab === tab.value }"
        @click="handleTabChange(tab.value)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div
      class="order-list"
      ref="listContainerRef"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Pull-to-refresh indicator -->
      <div class="pull-indicator" :class="pullState" :style="{ height: pullDistance + 'px' }">
        <span v-if="pullState === 'pulling'">下拉刷新</span>
        <span v-if="pullState === 'ready'">释放立即刷新</span>
        <span v-if="pullState === 'loading'">刷新中...</span>
      </div>

      <template v-if="orderList.length">
        <div class="order-card" v-for="order in orderList" :key="order.id">
          <div class="order-header">
            <span class="customer-info">{{ order.customerName || '未知客户' }} {{ order.customerPhone || '' }}</span>
            <span class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="order-content">
            <div class="order-img">
              <img
                v-if="order.serviceItemImageUrl"
                :src="order.serviceItemImageUrl"
                :alt="'服务项目'"
                class="order-cover-img"
                loading="lazy"
                @error="order.serviceItemImageUrl = null"
              />
              <el-icon v-if="!order.serviceItemImageUrl" :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
            <div class="order-info">
              <p class="order-create-time">下单时间: {{ order.createTime || '-' }}</p>
              <p class="order-price">金额: ¥ {{ order.totalAmount ?? 0 }}</p>
            </div>
          </div>
          <div class="order-footer">
            <el-badge :value="unreadCounts[order.orderId || order.id]" :hidden="!unreadCounts[order.orderId || order.id]" class="view-detail-badge">
              <el-button
                size="small"
                round
                @click="viewDetail(order)"
                class="view-detail-btn"
              >
                查看详情
              </el-button>
            </el-badge>
            <div class="action-buttons">
              <el-button
                v-if="order.status === '3'"
                size="small"
                type="primary"
                round
                class="main-btn"
                @click="startService(order)"
                :loading="startingOrderId === (order.orderId || order.id)"
              >
                开始服务
              </el-button>
              <el-button
                v-if="order.status === '4'"
                size="small"
                type="success"
                round
                disabled
              >
                服务中
              </el-button>
              <el-button
                v-if="order.status === '5' || order.status === '6'"
                size="small"
                type="info"
                round
                disabled
              >
                {{ getStatusText(order.status) }}
              </el-button>
              <span v-if="order.status === '5' && hasRating(order)" class="rating-done">
                客户评分 {{ getRatingScore(order) }} 分
              </span>
            </div>
          </div>
        </div>
        <!-- Infinite scroll states -->
        <div v-if="loadingMore" class="loading-more">加载中...</div>
        <div v-if="!hasMore && orderList.length > 0" class="no-more">— 没有更多了 —</div>
        <!-- Sentinel element for infinite scroll -->
        <div ref="sentinelRef" class="scroll-sentinel"></div>
      </template>
      <el-empty v-else :description="emptyMessage" />
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="92%" class="order-detail-dialog">
      <div v-loading="detailLoading">
        <el-descriptions v-if="currentOrder" :column="1" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderId || currentOrder.id || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥ {{ currentOrder.totalAmount ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户ID">{{ currentOrder.customerId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务项目ID">{{ currentOrder.serviceItemId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单明细号">{{ currentOrder.orderDetailNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务日期">{{ currentOrder.serviceDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务地址">{{ currentOrder.serviceAddress || currentOrder.address || '未提供' }}</el-descriptions-item>
          <el-descriptions-item label="上门时间范围">{{ currentOrder.visitTimeRange || '-' }}</el-descriptions-item>
          <el-descriptions-item label="服务时间范围">{{ currentOrder.serviceTimeRange || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际开始时间">{{ currentOrder.actualStartTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际结束时间">{{ currentOrder.actualEndTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.status === '5'" label="客户评分">
            <template v-if="hasRating(currentOrder)">
              <el-rate :model-value="Number(getRatingScore(currentOrder))" disabled show-score />
            </template>
            <span v-else>暂无评价</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.status === '5'" label="客户评价">
            {{ hasRating(currentOrder) ? (currentOrder.ratingComment || '暂无文字评价') : '暂无评价' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentOrder.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      <div v-if="currentOrder && canShowChatEntry(currentOrder.status)" style="text-align:center;margin-top:16px;">
        <el-badge :value="unreadCounts[currentOrder.orderId || currentOrder.id]" :hidden="!unreadCounts[currentOrder.orderId || currentOrder.id]" class="chat-entry-badge">
          <el-button type="primary" round style="width:80%;background:var(--app-primary-gradient);border:none;" @click="goChat(currentOrder.orderId || currentOrder.id)">
            联系客户
          </el-button>
        </el-badge>
      </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { usePullRefresh } from '@/composables/usePullRefresh'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEmployeeOrderList, startEmployeeService, getOrderDetail } from '@/api/order'
import { batchUnreadCount } from '@/api/message'
import { consumeReadOrderIds } from '@/utils/chat-state'

const tabs = [
  { label: '全部', value: '' },
  { label: '已派单', value: '3' },
  { label: '服务中', value: '4' },
  { label: '已完成', value: '5' },
  { label: '已取消', value: '6' }
]

const activeTab = ref('')
const tabsRef = ref(null)
const loading = ref(false)
const orderList = ref([])
const loadingMore = ref(false)
const hasMore = ref(true)
const listContainerRef = ref(null)
let currentPage = 1

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentOrder = ref(null)
const unreadCounts = ref({})

const startingOrderId = ref(null)

const emptyMessage = computed(() => {
  const map = {
    '': '暂无订单数据',
    '3': '暂无已派单订单',
    '4': '暂无服务中订单',
    '5': '暂无已完成订单',
    '6': '暂无已取消订单'
  }
  return map[activeTab.value] || '暂无订单数据'
})

const router = useRouter()

const fetchList = async (reset = false) => {
  if (reset) {
    currentPage = 1
    orderList.value = []
    hasMore.value = true
    loading.value = true
  }
  try {
    const reqData = { pageNo: currentPage, pageSize: 10 }
    if (activeTab.value !== '') {
      reqData.status = activeTab.value
    }
    const res = await getEmployeeOrderList(reqData)
    const data = res.data || {}
    const records = data.records || data.list || (Array.isArray(data) ? data : [])
    if (records.length < 10) hasMore.value = false
    orderList.value = reset ? records : [...orderList.value, ...records]
  } catch (error) {
    if (reset) { orderList.value = []; hasMore.value = false }
    ElMessage.error('网络异常，订单列表加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
  loadUnreadCounts()
}

const loadUnreadCounts = async () => {
  const ids = orderList.value.map(o => o.orderId || o.id).filter(Boolean)

  const readIds = consumeReadOrderIds()
  for (const id of readIds) {
    unreadCounts.value = { ...unreadCounts.value, [id]: 0 }
  }

  if (ids.length === 0) return
  try {
    const res = await batchUnreadCount(ids)
    if (res.data) {
      unreadCounts.value = res.data
    }
  } catch (e) {
    // non-critical
  }
}

const handleTabChange = (value) => {
  activeTab.value = value
  fetchList(true)
  nextTick(() => {
    if (tabsRef.value) {
      const activeTabEl = tabsRef.value.querySelector('.tab-item.active')
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
      }
    }
  })
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  currentPage++
  fetchList(false)
}

const doRefresh = () => fetchList(true)

const { pullState, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullRefresh(doRefresh)
const { sentinelRef } = useInfiniteScroll(loadMore, hasMore)

const getStatusClass = (status) => {
  const s = status?.toString()
  if (s === '3') return 'primary'
  if (s === '4') return 'warning'
  if (s === '5') return 'success'
  if (s === '6') return 'danger'
  return ''
}

const getStatusType = (status) => {
  const s = status?.toString()
  if (s === '3') return 'primary'
  if (s === '4') return 'warning'
  if (s === '5') return 'success'
  if (s === '6') return 'info'
  return ''
}

const getStatusText = (status) => {
  const map = {
    '1': '待支付',
    '2': '待派单',
    '3': '已派单',
    '4': '服务中',
    '5': '已完成',
    '6': '已取消'
  }
  return map[status?.toString()] || (status ?? '-')
}

const hasRating = (order) => Boolean(order?.rated || order?.ratingScore)
const getRatingScore = (order) => order?.ratingScore ?? '-'

const viewDetail = async (order) => {
  detailVisible.value = true
  detailLoading.value = true
  // 使用订单基本信息
  currentOrder.value = { ...order }
  try {
    // 仍然获取完整详情，包含更多字段如服务地址、时间范围等
    const res = await getOrderDetail({ orderId: order.orderId || order.id })
    currentOrder.value = { ...currentOrder.value, ...(res.data || {}) }
  } catch (error) {
    // 即使获取详情失败，仍显示基本订单信息
    ElMessage.error('获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const startService = async (order) => {
  const orderId = order.orderId || order.id
  if (!orderId) {
    ElMessage.warning('订单号不存在')
    return
  }
  try {
    startingOrderId.value = orderId
    await startEmployeeService({ orderId })
    ElMessage.success('开始服务成功')
    // 刷新列表
    fetchList(true)
  } catch (error) {
    ElMessage.error('开始服务失败')
  } finally {
    startingOrderId.value = null
  }
}

const goChat = (orderId) => {
  detailVisible.value = false
  router.push(`/employee/chat/${orderId}`)
}

const canShowChatEntry = (status) => {
  const s = status?.toString()
  return s === '3' || s === '4' || s === '5' || s === '6'
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.orders-container {
  padding: 16px;
  background: var(--app-bg);
  min-height: calc(100dvh - var(--tab-bar-height));
}

.header {
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
  font-size: var(--font-title);
  color: var(--app-text-primary);
}

.status-tabs {
  display: flex;
  overflow-x: auto;
  gap: 14px;
  margin-bottom: 14px;
  padding: 0 2px 4px;
}

.status-tabs::-webkit-scrollbar {
  display: none;
}

.tab-item {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--app-text-secondary);
  padding-bottom: 4px;
  position: relative;
  white-space: nowrap;
  cursor: pointer;
}

.tab-item.active {
  color: var(--app-primary);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: -1px;
  width: 18px;
  height: 3px;
  background: var(--app-primary);
  border-radius: 3px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.order-card {
  background: var(--app-bg-white);
  border-radius: var(--radius-lg);
  padding: 12px;
  border: 1px solid var(--app-border);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--app-border-light);
}

.customer-info {
  color: var(--app-text-primary);
  font-size: 14px;
  font-weight: 500;
}

.order-status {
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 600;
}

.order-status.primary {
  color: var(--app-primary);
}

.order-status.warning {
  color: var(--app-warning);
}

.order-status.success {
  color: var(--app-success);
}

.order-status.danger {
  color: var(--app-danger);
}

.order-content {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.order-img {
  width: 56px;
  height: 56px;
  background: var(--app-bg-input);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.order-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.order-info {
  flex: 1;
}


.order-info p {
  margin: 2px 0;
  font-size: 12px;
  color: var(--app-text-muted);
}

.order-create-time {
  font-size: 13px !important;
  color: var(--app-text-secondary) !important;
  margin-bottom: 4px !important;
}

.order-price {
  font-size: 15px !important;
  color: var(--app-text-primary) !important;
  font-weight: 600 !important;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  margin-top: 8px;
}

.view-detail-btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  justify-content: flex-end;
  min-width: 0; /* Allow buttons to shrink if needed */
}

@media (max-width: 360px) {
  .order-footer {
    flex-wrap: wrap;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-start;
    margin-top: 8px;
  }
}

.action-buttons .main-btn {
  border: none;
  background: var(--app-primary-gradient);
}

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s;
  color: var(--app-text-muted);
  font-size: 13px;
}

.loading-more {
  text-align: center;
  padding: 12px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.no-more {
  text-align: center;
  padding: 12px;
  color: var(--app-text-placeholder);
  font-size: 12px;
}

.scroll-sentinel {
  height: 1px;
}

.view-detail-badge {
  margin-right: 8px;
}

.rating-done {
  color: var(--app-warning);
  font-size: 12px;
  white-space: nowrap;
}

.chat-entry-badge {
  width: 80%;
}

:deep(.order-detail-dialog .el-dialog) {
  max-width: 420px;
  border-radius: var(--radius-md);
}
</style>
