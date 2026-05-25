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
        <h2>员工注册</h2>
        <p>欢迎加入员工端服务平台</p>
      </div>

      <el-form ref="formRef" :model="registerForm" :rules="rules" class="auth-form" @submit.prevent>
        <el-form-item prop="account">
          <el-input
            v-model="registerForm.account"
            placeholder="手机号或邮箱"
            size="large"
            class="auth-input"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="用户名"
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
            v-model="registerForm.password"
            type="password"
            placeholder="密码（至少6位）"
            size="large"
            class="auth-input"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            class="auth-input"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          type="primary"
          class="auth-btn"
          size="large"
          @click="handleRegister"
          :loading="loading"
        >
          {{ loading ? '注册中...' : '注 册' }}
        </el-button>

        <div class="auth-links">
          <span @click="router.push('/employee/login')">已有账号？去登录</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/login'

const router = useRouter()
const loading = ref(false)
const formRef = ref(null)

const registerForm = reactive({
  account: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const validateAccount = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入手机号或邮箱'))
    return
  }
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  const isPhone = /^1[3-9]\d{9}$/.test(value)
  if (!isEmail && !isPhone) {
    callback(new Error('请输入有效的手机号或邮箱'))
    return
  }
  callback()
}

const validatePassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入密码'))
    return
  }
  if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
    return
  }
  callback()
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请确认密码'))
    return
  }
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }
  callback()
}

const rules = {
  account: [{ required: true, validator: validateAccount, trigger: 'blur' }],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名至少2个字符', trigger: 'blur' }
  ],
  password: [{ required: true, validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: validateConfirmPassword, trigger: 'blur' }]
}

const handleRegister = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.account)
  const data = {
    username: registerForm.username,
    password: registerForm.password,
    role: 2
  }
  if (isEmail) {
    data.email = registerForm.account
  } else {
    data.phone = registerForm.account
  }

  try {
    loading.value = true
    await register(data)
    ElMessage.success('注册成功')
    router.push('/employee/login')
  } catch (error) {
    const msg = error?.response?.data?.msg || error?.message || '注册失败，请稍后重试'
    ElMessage.error(msg)
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
  justify-content: center;
  margin-top: 4px;
  font-size: 13px;
  color: #52b788;
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
