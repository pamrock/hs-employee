import request from '@/utils/request'

export function updateEmployee(data) {
    return request.post('/employee/update', data)
}

// 获取当前员工完整信息
export function getSelfInfo() {
  return request.post('/employee/self/info')
}