<template>
  <div class="auth-container">
    <div class="auth-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🧹</div>
        <h2>员工登录</h2>
        <p>家政服务平台</p>
      </div>

      <el-form ref="formRef" :model="loginForm" :rules="rules" class="auth-form" @submit.prevent>
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="手机号/邮箱/用户名"
            size="large"
            class="auth-input"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            class="auth-input"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="captcha">
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              placeholder="验证码"
              size="large"
              class="captcha-input"
            >
              <template #prefix>
                <el-icon><Key /></el-icon>
              </template>
            </el-input>
            <div class="captcha-img" @click="refreshCaptcha">
              <img v-if="captchaUrl" :src="captchaUrl" alt="验证码" class="captcha-image" />
              <span v-else class="captcha-loading">点击获取</span>
            </div>
          </div>
        </el-form-item>

        <el-checkbox v-model="rememberMe" class="remember-checkbox">记住密码</el-checkbox>

        <el-button
          type="primary"
          class="auth-btn"
          size="large"
          @click="handleLogin"
          :loading="loading"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>

        <div class="auth-links">
          <span @click="router.push('/employee/register')">注册账号</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login, getCaptcha } from '@/api/login'
import { setEmployeeToken } from '@/utils/auth'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)
const captchaUrl = ref('')
const captchaId = ref('')
const formRef = ref(null)

const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名/手机号/邮箱', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captcha: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const refreshCaptcha = async () => {
  try {
    captchaUrl.value = ''
    const res = await getCaptcha()
    if (res.data && res.data.success !== false) {
      const captchaData = res.data.data || res.data
      captchaId.value = captchaData.captchaId
      captchaUrl.value = captchaData.captchaImage
    }
  } catch (e) {
    ElMessage.warning('验证码加载失败，请点击重试')
  }
}

const loadRemembered = () => {
  try {
    const saved = localStorage.getItem('employee_remember')
    if (saved) {
      const data = JSON.parse(saved)
      loginForm.username = data.username || ''
      rememberMe.value = true
    }
  } catch (e) {
    localStorage.removeItem('employee_remember')
  }
}

const saveRemembered = () => {
  if (rememberMe.value) {
    localStorage.setItem('employee_remember', JSON.stringify({
      username: loginForm.username
    }))
  } else {
    localStorage.removeItem('employee_remember')
  }
}

onMounted(() => {
  loadRemembered()
  refreshCaptcha()
})

const handleLogin = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  try {
    loading.value = true
    const data = await login({
      username: loginForm.username,
      password: loginForm.password,
      captchaId: captchaId.value,
      captchaCode: loginForm.captcha
    })

    if (!data.success) {
      ElMessage.error(data.msg || '登录失败')
      refreshCaptcha()
      return
    }

    const token = data.data.token || ''
    setEmployeeToken(token)
    saveRemembered()
    ElMessage.success('登录成功')
    router.push('/employee/orders')
  } catch (error) {
    const msg = error?.response?.data?.msg || error?.message || '登录失败，请检查网络连接'
    ElMessage.error(msg)
    refreshCaptcha()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: linear-gradient(135deg, #a8e6cf 0%, #88d8b0 25%, #6ecba0 60%, #56c596 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-shape {
  position: absolute;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
}

.shape-1 {
  width: 220px;
  height: 220px;
  top: -60px;
  right: -60px;
}

.shape-2 {
  width: 160px;
  height: 160px;
  bottom: -40px;
  left: -40px;
  opacity: 0.7;
}

.shape-3 {
  width: 80px;
  height: 80px;
  top: 35%;
  left: 15%;
  opacity: 0.5;
}

.auth-card {
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 32px 24px;
  margin: 20px;
  width: calc(100% - 40px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  position: relative;
  z-index: 1;
}

.auth-header {
  text-align: center;
  margin-bottom: 28px;
}

.auth-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.auth-header h2 {
  font-size: 22px;
  color: #2d6a4f;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.auth-header p {
  font-size: 13px;
  color: #52b788;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-form :deep(.el-form-item) {
  margin-bottom: 0;
}
.auth-form :deep(.el-form-item__error) {
  font-size: 12px;
  padding-top: 2px;
  position: static;
}

.auth-input :deep(.el-input__wrapper) {
  background: #f6fdf9;
  box-shadow: none !important;
  border-radius: 12px;
  padding: 4px 14px;
}

.auth-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #52b788 inset !important;
}

.captcha-row {
  display: flex;
  gap: 10px;
}

.captcha-input {
  flex: 1;
}

.captcha-input :deep(.el-input__wrapper) {
  background: #f6fdf9;
  box-shadow: none !important;
  border-radius: 12px;
  padding: 4px 14px;
}

.captcha-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #52b788 inset !important;
}

.captcha-img {
  width: 100px;
  height: 44px;
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
}

.captcha-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.captcha-loading {
  font-size: 12px;
  color: #52b788;
}

.remember-checkbox {
  font-size: 13px;
}

.remember-checkbox :deep(.el-checkbox__label) {
  color: #666;
}

.auth-btn {
  width: 100%;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #52b788, #40916c);
  border: none;
  font-size: 16px;
  box-shadow: 0 4px 16px rgba(64,145,108,0.3);
  margin-top: 4px;
}

.auth-links {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 13px;
  color: #52b788;
}

.auth-links span {
  cursor: pointer;
}

[data-theme="dark"] .auth-container {
  background: linear-gradient(135deg, #1a3a2a 0%, #0d2818 50%, #0a1a10 100%);
}

[data-theme="dark"] .auth-card {
  background: rgba(26, 26, 36, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
