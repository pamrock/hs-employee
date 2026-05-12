<template>
  <div class="chat-container">
    <div class="chat-header">
      <div class="back-btn" @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="header-info">
        <div class="contact-name">{{ contactName }}</div>
        <div class="order-snippet">订单 {{ orderId }}</div>
      </div>
    </div>

    <div class="message-list" ref="msgListRef">
      <div v-if="loading" class="loading-wrap">
        <span>加载中...</span>
      </div>
      <template v-for="msg in messages" :key="msg.id">
        <div class="time-divider" v-if="shouldShowTime(msg, messages)">{{ formatTime(msg.createTime) }}</div>
        <div class="message-row" :class="{ 'is-self': isSelf(msg) }">
          <div class="avatar" v-if="!isSelf(msg)">{{ contactAvatar }}</div>
          <div class="message-bubble" :class="{ 'is-self': isSelf(msg) }">
            <img
              v-if="msg.msgType === 'image'"
              :src="msg.imageUrl"
              class="msg-image"
              @click="previewImage(msg.imageUrl)"
            />
            <div v-else class="msg-text">{{ msg.content }}</div>
          </div>
          <div class="avatar avatar-self" v-if="isSelf(msg)">{{ myAvatar }}</div>
        </div>
      </template>
      <div v-if="!canSend" class="chat-closed-hint">
        {{ chatDisabledReason }}
      </div>
    </div>

    <div class="input-area">
      <el-upload
        class="img-upload-btn"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :http-request="handleUploadImage"
        accept="image/*"
        :disabled="!canSend"
      >
        <el-icon :size="22"><PictureFilled /></el-icon>
      </el-upload>
      <input
        v-model="inputText"
        class="text-input"
        :placeholder="canSend ? '请输入消息...' : chatDisabledReason"
        :disabled="!canSend"
        @keyup.enter="handleSend"
      />
      <button class="send-btn" :disabled="!canSend || !inputText.trim()" @click="handleSend">发送</button>
    </div>

    <el-dialog v-model="imagePreviewVisible" width="90%" :show-close="true">
      <img :src="previewUrl" style="width: 100%;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, PictureFilled } from '@element-plus/icons-vue'
import { connect, sendMessage, disconnect, isConnected } from '@/utils/stomp'
import { getMessages, markMessagesRead, canChat, uploadChatImage } from '@/api/message'
import { getOrderDetail } from '@/api/order'
import { getCustomerList } from '@/api/customer'
import { getEmployeeToken } from '@/utils/auth'
import { markOrderAsRead } from '@/utils/chat-state'

const route = useRoute()
const router = useRouter()
const orderId = ref(route.params.orderId || '')
const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const canSend = ref(true)
const wsConnected = ref(false)
const chatDisabledReason = ref('')
const msgListRef = ref(null)
const imagePreviewVisible = ref(false)
const previewUrl = ref('')
const contactName = ref('客户')
const contactAvatar = ref('客')
const myAvatar = ref('我')

const token = getEmployeeToken()

const isSelf = (msg) => msg.senderRole === 'employee'

const shouldShowTime = (msg, list) => {
  const idx = list.indexOf(msg)
  if (idx === 0) return true
  const prev = list[idx - 1]
  const diff = new Date(msg.createTime) - new Date(prev.createTime)
  return diff > 5 * 60 * 1000
}

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${min}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (msgListRef.value) {
    msgListRef.value.scrollTop = msgListRef.value.scrollHeight
  }
}

const loadHistory = async () => {
  loading.value = true
  try {
    const res = await getMessages(orderId.value, { pageNo: 1, pageSize: 100 })
    const data = res.data || {}
    messages.value = data.records || []
    if (messages.value.length > 0) {
      await markMessagesRead(orderId.value, 'employee')
    }
    await scrollToBottom()
  } catch (e) {
    ElMessage.warning('加载消息失败')
  } finally {
    loading.value = false
  }
}

const loadOrderInfo = async () => {
  try {
    const res = await getOrderDetail({ orderId: orderId.value })
    const detail = res.data
    if (detail && detail.customerId) {
      try {
        const custRes = await getCustomerList({ id: detail.customerId })
        const custData = custRes.data || {}
        const custList = custData.records || custData.list || []
        if (custList.length > 0) {
          contactName.value = custList[0].realName || '客户'
        }
      } catch (e) {}
    }
  } catch (e) {
    // non-critical
  }
}

const checkChatStatus = async () => {
  try {
    const res = await canChat(orderId.value)
    if (res.data === false) {
      canSend.value = false
      chatDisabledReason.value = '该订单已超过沟通时效'
    }
  } catch (e) {
    // allow by default
  }
}

const handleSend = () => {
  const text = inputText.value.trim()
  if (!text) return
  if (!isConnected()) {
    ElMessage.warning('正在连接中，请稍后发送')
    return
  }
  const optimisticId = Date.now()
  const localMsg = {
    id: optimisticId,
    orderId: orderId.value,
    senderId: 0,
    senderRole: 'employee',
    msgType: 'text',
    content: text,
    isRead: 1,
    createTime: new Date().toISOString()
  }
  messages.value.push(localMsg)
  scrollToBottom()
  sendMessage(orderId.value, {
    orderId: orderId.value,
    msgType: 'text',
    content: text
  })
  inputText.value = ''
}

const handleBeforeUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

const handleUploadImage = async (options) => {
  try {
    const res = await uploadChatImage(orderId.value, options.file)
    const url = res.data
    if (url) {
      sendMessage(orderId.value, {
        orderId: orderId.value,
        msgType: 'image',
        imageUrl: url
      })
    }
  } catch (e) {
    ElMessage.error('图片上传失败')
  }
}

const previewImage = (url) => {
  previewUrl.value = url
  imagePreviewVisible.value = true
}

const handleBack = () => {
  disconnect()
  router.back()
}

const onMessage = (msg) => {
  // dedup: replace optimistic local message (id is Date.now timestamp > 1e12)
  const idx = messages.value.findIndex(m => m.id > 1000000000000 && m.content === msg.content && m.senderRole === msg.senderRole)
  if (idx >= 0) {
    messages.value[idx] = msg
  } else {
    messages.value.push(msg)
  }
  scrollToBottom()
}

onMounted(async () => {
  await loadOrderInfo()
  await checkChatStatus()
  await loadHistory()
  connect(token, orderId.value, onMessage, () => {
    wsConnected.value = true
  }, (errMsg) => {
    ElMessage.error('连接失败：' + errMsg)
    router.back()
  })
})

onUnmounted(() => {
  disconnect()
  markOrderAsRead(orderId.value)
})
</script>

<style scoped>
.chat-container { display: flex; flex-direction: column; height: 100dvh; background: #f0f0f0; }
.chat-header { display: flex; align-items: center; padding: 10px 12px; background: #f5f7fa; border-bottom: 1px solid #e5e5e5; }
.back-btn { font-size: 20px; margin-right: 10px; color: #333; cursor: pointer; }
.header-info { flex: 1; }
.contact-name { font-size: 16px; font-weight: 600; color: #1f2329; }
.order-snippet { font-size: 12px; color: #888; }
.message-list { flex: 1; overflow-y: auto; padding: 10px 12px; }
.loading-wrap { text-align: center; color: #aaa; padding: 20px; font-size: 13px; }
.time-divider { text-align: center; font-size: 11px; color: #aaa; margin: 10px 0; }
.message-row { display: flex; margin: 6px 0; align-items: flex-start; }
.message-row.is-self { justify-content: flex-end; }
.avatar, .avatar-self { width: 34px; height: 34px; border-radius: 4px; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.avatar { margin-right: 8px; background: #1e3c72; }
.avatar-self { margin-left: 8px; background: #07c160; }
.message-bubble { max-width: 65%; padding: 10px 13px; border-radius: 4px 14px 14px 14px; background: white; word-break: break-all; }
.message-bubble.is-self { background: #95ec69; border-radius: 14px 4px 14px 14px; }
.msg-text { font-size: 14px; color: #333; line-height: 1.5; }
.msg-image { max-width: 180px; max-height: 180px; border-radius: 6px; cursor: pointer; }
.chat-closed-hint { text-align: center; color: #999; font-size: 13px; padding: 20px; }
.input-area { display: flex; align-items: center; padding: 8px 10px; background: white; border-top: 1px solid #e5e5e5; gap: 8px; }
.img-upload-btn { flex-shrink: 0; color: #888; cursor: pointer; }
.text-input { flex: 1; border: none; outline: none; font-size: 14px; padding: 8px 4px; background: #f5f5f5; border-radius: 4px; }
.send-btn { flex-shrink: 0; background: #1e3c72; color: white; border: none; border-radius: 4px; padding: 8px 16px; font-size: 13px; cursor: pointer; }
.send-btn:disabled { background: #c0c4cc; cursor: not-allowed; }
</style>
