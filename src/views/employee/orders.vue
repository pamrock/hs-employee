<template>
  <div class="orders-container">
    <div class="header">
      <h2>员工订单</h2>
    </div>

    <div class="status-tabs">
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

    <div class="order-list" v-loading="loading">
      <template v-if="orderList.length">
        <div class="order-card" v-for="order in orderList" :key="order.id">
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderId || order.id }}</span>
            <span class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="order-content">
            <div class="order-img">
              <el-icon :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
            <div class="order-info">
              <p class="order-create-time">下单时间: {{ order.createTime || '-' }}</p>
              <p class="order-price">金额: ¥ {{ order.totalAmount ?? 0 }}</p>
            </div>
          </div>
          <div class="order-footer">
            <el-button
              size="small"
              round
              @click="viewDetail(order)"
              class="view-detail-btn"
            >
              查看详情
            </el-button>
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
                v-if="order.status === '3'"
                size="small"
                type="danger"
                round
                @click="cancelService(order)"
                :loading="cancellingOrderId === (order.orderId || order.id)"
              >
                取消服务
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
            </div>
          </div>
        </div>
        <div class="pagination-wrap">
          <el-pagination
            v-model:current-page="queryParams.pageNo"
            v-model:page-size="queryParams.pageSize"
            layout="prev, pager, next"
            :total="total"
            :pager-count="5"
            @current-change="handleCurrentChange"
          />
        </div>
      </template>
      <el-empty v-else description="暂无订单数据" />
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
          <el-descriptions-item label="备注">{{ currentOrder.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      <div v-if="currentOrder && canShowChatEntry(currentOrder.status)" style="text-align:center;margin-top:16px;">
        <el-button type="primary" round style="width:80%;background:linear-gradient(135deg, #1e3c72, #2a5298);border:none;" @click="goChat(currentOrder.orderId || currentOrder.id)">
          联系客户
        </el-button>
      </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getEmployeeOrderList, startEmployeeService, cancelEmployeeService, getOrderDetail } from '@/api/order'

const tabs = [
  { label: '已派单', value: '3' },
  { label: '服务中', value: '4' },
  { label: '已完成', value: '5' },
  { label: '已取消', value: '6' }
]

const activeTab = ref('3')
const loading = ref(false)
const orderList = ref([])
const total = ref(0)
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  status: '3'
})

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentOrder = ref(null)

const startingOrderId = ref(null)
const cancellingOrderId = ref(null)

const router = useRouter()

const fetchList = async () => {
  loading.value = true
  try {
    const reqData = { ...queryParams }
    reqData.status = activeTab.value
    const res = await getEmployeeOrderList(reqData)
    const data = res.data || {}
    orderList.value = data.records || data.list || (Array.isArray(data) ? data : [])
    total.value = data.total || orderList.value.length || 0
  } catch (error) {
    orderList.value = []
    total.value = 0
    ElMessage.error('网络异常，订单列表加载失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (value) => {
  activeTab.value = value
  queryParams.pageNo = 1
  fetchList()
}

const handleCurrentChange = (value) => {
  queryParams.pageNo = value
  fetchList()
}

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
    fetchList()
  } catch (error) {
    ElMessage.error('开始服务失败')
  } finally {
    startingOrderId.value = null
  }
}

const cancelService = async (order) => {
  const orderId = order.orderId || order.id
  if (!orderId) {
    ElMessage.warning('订单号不存在')
    return
  }
  try {
    await ElMessageBox.confirm('确定取消服务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    cancellingOrderId.value = orderId
    await cancelEmployeeService({ orderId })
    ElMessage.success('取消服务成功')
    // 刷新列表
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消服务失败')
    }
  } finally {
    cancellingOrderId.value = null
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
  background: #f7f8fa;
  min-height: calc(100vh - 84px);
}

.header {
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2329;
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
  color: #646f83;
  padding-bottom: 4px;
  position: relative;
}

.tab-item.active {
  color: #1e3c72;
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
  background: #1e3c72;
  border-radius: 3px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  border: 1px solid #ebedf0;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.order-no {
  color: #7b8495;
  font-size: 12px;
}

.order-status {
  color: #1e3c72;
  font-size: 13px;
  font-weight: 600;
}

.order-status.primary {
  color: #1e3c72;
}

.order-status.warning {
  color: #e6a23c;
}

.order-status.success {
  color: #67c23a;
}

.order-status.danger {
  color: #f56c6c;
}

.order-content {
  display: flex;
  gap: 10px;
  margin: 12px 0;
}

.order-img {
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.order-info {
  flex: 1;
}


.order-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #8d95a3;
}

.order-create-time {
  font-size: 13px !important;
  color: #5a6376 !important;
  margin-bottom: 4px !important;
}

.order-price {
  font-size: 15px !important;
  color: #1f2329 !important;
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
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

:deep(.order-detail-dialog .el-dialog) {
  max-width: 420px;
  border-radius: 12px;
}
</style>