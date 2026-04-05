import request from '@/utils/request'

// 获取我的订单列表
export function getMyOrderList(data) {
  return request.post('/order/my/list', data)
}

// 获取订单列表
export function getOrderList(data) {
  return request.post('/order/list', data)
}

// 获取订单详情
export function getOrderDetail(data) {
  return request.post('/order/detail', data)
}

// 新增订单
export function addOrder(data) {
  return request.post('/order/add', data)
}

// 修改订单
export function updateOrder(data) {
  return request.post('/order/update', data)
}

// 修改订单状态
export function updateOrderStatus(data) {
  return request.post('/order/updateStatus', data)
}

// 删除订单
export function deleteOrder(data) {
  return request.post('/order/delete', data)
}

// 订单派单
export function dispatchOrder(data) {
  return request.post('/order/dispatchOrder', data)
}

// 员工专属接口

// 查询员工订单（状态为已派单）
export function getEmployeeOrderList(data) {
  return request.post('/order/employee/list', data)
}

// 开始服务
export function startEmployeeService(data) {
  return request.post('/order/employee/start', data)
}

// 取消服务
export function cancelEmployeeService(data) {
  return request.post('/order/employee/cancel', data)
}