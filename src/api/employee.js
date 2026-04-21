import request from '@/utils/request'

export function updateEmployee(data) {
    return request.post('/employee/update', data)
}