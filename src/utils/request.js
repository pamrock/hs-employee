import axios from 'axios'
import { getToken, getEmployeeToken, removeToken, removeEmployeeToken } from './auth'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: import.meta.env.DEV ? '/api' : 'https://admint.pamrock.top/api',
  timeout: 100000
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const currentPath = (window.location.hash || '').replace(/^#/, '').split('?')[0]
    const isEmployeeRoute = currentPath.startsWith('/employee')
    const token = isEmployeeRoute ? getEmployeeToken() : getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
instance.interceptors.response.use(
  response => {
    const res = response.data

    if (res && res.code && res.code === 1020) {
      ElMessage.error(res.msg || '服务器内部错误')
      return Promise.reject({ code: 1020, message: res.msg })
    }

    return res
  },
  error => {
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查后端服务或网络')
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = (window.location.hash || '').replace(/^#/, '').split('?')[0]
      const isEmployeeRoute = currentPath.startsWith('/employee')
      if (isEmployeeRoute) {
        removeEmployeeToken()
        window.location.href = '/#/employee/login?session=expired'
      } else {
        removeToken()
        window.location.href = '/#/login?session=expired'
      }
    }
    return Promise.reject(error)
  }
)

export default instance