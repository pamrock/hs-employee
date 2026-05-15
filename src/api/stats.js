import request from '@/utils/request'

export function getEmployeeTrend(data) {
  return request.post('/stats/employee/trend', data)
}

export function getEmployeeRanking(data) {
  return request.post('/stats/employee/ranking', data)
}

export function getOrderSummary(data) {
  return request.post('/stats/order/summary', data)
}

export function getRevenueSummary(data) {
  return request.post('/stats/revenue/summary', data)
}

export function getDashboard() {
  return request.post('/stats/dashboard')
}
