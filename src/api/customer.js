import request from '@/utils/request'

export function getCustomerList(data) {
  return request.post('/customer/list', data)
}
