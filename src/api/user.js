import request from '@/utils/request'

export function getUserList(data) {
    return request.post('/user/list', data)
}

export function addUser(data) {
    return request.post('/user/addUser', data)
}

export function updateUser(data) {
    return request.post('/user/updateUser', data)
}

export function deleteUser(data) {
    return request.post('/user/deleteUser', data)
}

export function forceLogout(data) {
    return request.post('/user/forceLogout', data)
}

export function updatePassword(data) {
    return request.post('/user/updateUserPassword', data)
}

export function getUserInfo(role) {
    return request.post('/user/info', null, { params: { role } })
}

export function isUserInActive() {
    return request.get('/user/isUserInActive')
}

export function updateUserBySelf(data, file) {
    const formData = new FormData()
    formData.append('request', new Blob([JSON.stringify(data)], { type: 'application/json' }))
    if (file) {
        formData.append('file', file)
    }
    return request.post('/user/updateUserBySelf', formData)
}