// 已读订单 ID 集合，用于跨页签传递未读清零状态
const readOrderIds = new Set()

export function markOrderAsRead(orderId) {
  readOrderIds.add(orderId)
}

export function consumeReadOrderIds() {
  const ids = Array.from(readOrderIds)
  readOrderIds.clear()
  return ids
}
