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

      <div class="auth-form">
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

        <el-input
          v-model="registerForm.password"
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

        <div class="captcha-row">
          <el-input
            v-model="registerForm.captcha"
            placeholder="验证码"
            size="large"
            class="captcha-input"
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
          <div class="captcha-img" @click="refreshCaptcha">
            <span v-if="!captchaUrl" class="captcha-placeholder">{{ captchaPlaceholder }}</span>
            <img v-else :src="captchaUrl" alt="验证码" />
          </div>
        </div>

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
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/login'

const router = useRouter()
const loading = ref(false)
const captchaUrl = ref('')
const captchaPlaceholder = ref('')

const registerForm = reactive({
  account: '',
  username: '',
  password: '',
  captcha: ''
})

const generateCaptchaPlaceholder = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaPlaceholder.value = code
}

const refreshCaptcha = () => {
  generateCaptchaPlaceholder()
}

onMounted(() => {
  refreshCaptcha()
})

const handleRegister = async () => {
  if (!registerForm.account || !registerForm.username || !registerForm.password) {
    ElMessage.warning('请填写完整注册信息')
    return
  }
  if (!registerForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.account)
  const isPhone = /^1[3-9]\d{9}$/.test(registerForm.account)

  if (!isEmail && !isPhone) {
    ElMessage.warning('请输入有效的手机号或邮箱')
    return
  }

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
    console.error('注册失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: linear-gradient(135deg, #a8e6cf 0%, #88d8b0 25%, #6ecba0 60%, #56c596 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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

.captcha-placeholder {
  font-size: 18px;
  font-weight: bold;
  color: #2d6a4f;
  letter-spacing: 4px;
  font-style: italic;
  user-select: none;
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
</style>
