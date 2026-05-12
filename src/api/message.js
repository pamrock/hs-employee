import request from '@/utils/request'

export function getMessages(orderId, data) {
  return request.post(`/order/${orderId}/messages`, data)
}

export function markMessagesRead(orderId) {
  return request.post(`/order/${orderId}/messages/read`)
}

export function canChat(orderId) {
  return request.post(`/order/${orderId}/can-chat`)
}

export function uploadChatImage(orderId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/order/${orderId}/message/upload-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function batchUnreadCount(orderIds) {
  return request.post('/order/messages/unread-count', { orderIds })
}
