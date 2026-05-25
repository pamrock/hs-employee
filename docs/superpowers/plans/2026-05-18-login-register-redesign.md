# 登录/注册页面视觉优化 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为三个前端项目（hs-user、hs-employee、my-admin）的 6 个登录/注册页面实现视觉优化，包含绿色渐变毛玻璃风格（C端）和图片背景毛玻璃风格（管理端），并新增验证码和记住密码功能。

**Architecture:** 每个页面独立修改，C 端（用户 + 员工）共享相同的视觉模板仅标题和 icon 不同，管理端使用独立深色方案。所有页面保持现有 API 调用和路由逻辑不变，仅更新 template、style 和少量新增 script 逻辑。

**Tech Stack:** Vue 3 + Element Plus + Vite, 不新增依赖。

---

### Task 1: hs-user 用户登录页

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-user/src/views/user/login.vue`

- [ ] **Step 1: 重写 login.vue 完整代码**

```vue
<template>
  <div class="auth-container">
    <div class="auth-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🏠</div>
        <h2>欢迎回来</h2>
        <p>让家更温馨</p>
      </div>

      <div class="auth-form">
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
            <span v-if="!captchaUrl" class="captcha-placeholder">{{ captchaPlaceholder }}</span>
            <img v-else :src="captchaUrl" alt="验证码" />
          </div>
        </div>

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
          <span @click="router.push('/user/register')">注册账号</span>
          <span>忘记密码？</span>
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
import { login } from '@/api/login'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)
const captchaUrl = ref('')
const captchaId = ref('')
const captchaPlaceholder = ref('')

const loginForm = reactive({
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
  // TODO: 对接后端验证码接口后替换为:
  // request.get('/api/captcha').then(res => {
  //   captchaUrl.value = res.data.image
  //   captchaId.value = res.data.captchaId
  // })
}

const loadRemembered = () => {
  try {
    const saved = localStorage.getItem('user_remember')
    if (saved) {
      const data = JSON.parse(saved)
      loginForm.username = data.username || ''
      loginForm.password = data.password || ''
      rememberMe.value = true
    }
  } catch (e) {
    localStorage.removeItem('user_remember')
  }
}

const saveRemembered = () => {
  if (rememberMe.value) {
    localStorage.setItem('user_remember', JSON.stringify({
      username: loginForm.username,
      password: loginForm.password
    }))
  } else {
    localStorage.removeItem('user_remember')
  }
}

onMounted(() => {
  loadRemembered()
  refreshCaptcha()
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名/手机号/邮箱和密码')
    return
  }
  if (!loginForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }

  try {
    loading.value = true
    const { data } = await login({
      username: loginForm.username,
      password: loginForm.password
    })
    const token = data.token
    localStorage.setItem('user_token', token)
    saveRemembered()
    ElMessage.success('登录成功')
    router.push('/user/services')
  } catch (error) {
    console.error('登录失败:', error)
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
</style>
```

- [ ] **Step 2: 验证页面**

```bash
cd /Users/pamrock/Antigravity/hs-user && yarn dev
```

打开浏览器检查登录页面视觉效果：绿色渐变背景、毛玻璃卡片、验证码区域、记住密码复选框、圆点装饰。

---

### Task 2: hs-user 用户注册页

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-user/src/views/user/register.vue`

- [ ] **Step 1: 重写 register.vue 完整代码**

```vue
<template>
  <div class="auth-container">
    <div class="auth-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-icon">🏠</div>
        <h2>注册账号</h2>
        <p>欢迎加入家政服务平台</p>
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
          <span @click="router.push('/user/login')">已有账号？去登录</span>
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
    router.push('/user/login')
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
```

- [ ] **Step 2: 验证页面**

在浏览器中导航到 `/user/register`，确认视觉效果与登录页一致，验证码区域正常展示。

---

### Task 3: hs-employee 员工登录页

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-employee/src/views/employee/login.vue`

- [ ] **Step 1: 重写 login.vue，标题和 icon 改为员工端专属**

模板结构与 Task 1 相同，区别：
- icon: `🧹`，标题: `员工登录`，副标题: `家政服务平台`
- API 导入 `{ login } from '@/api/login'`（已存在）
- token 存储使用 `setEmployeeToken(token)` from `@/utils/auth`（保持原有）
- 路由跳转 `/employee/orders`（保持原有）
- remember key: `employee_remember`

完整代码：

```vue
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

      <div class="auth-form">
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
            <span v-if="!captchaUrl" class="captcha-placeholder">{{ captchaPlaceholder }}</span>
            <img v-else :src="captchaUrl" alt="验证码" />
          </div>
        </div>

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
          <span>忘记密码？</span>
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
import { login } from '@/api/login'
import { setEmployeeToken } from '@/utils/auth'

const router = useRouter()
const loading = ref(false)
const rememberMe = ref(false)
const captchaUrl = ref('')
const captchaPlaceholder = ref('')

const loginForm = reactive({
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

const loadRemembered = () => {
  try {
    const saved = localStorage.getItem('employee_remember')
    if (saved) {
      const data = JSON.parse(saved)
      loginForm.username = data.username || ''
      loginForm.password = data.password || ''
      rememberMe.value = true
    }
  } catch (e) {
    localStorage.removeItem('employee_remember')
  }
}

const saveRemembered = () => {
  if (rememberMe.value) {
    localStorage.setItem('employee_remember', JSON.stringify({
      username: loginForm.username,
      password: loginForm.password
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
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名/手机号/邮箱和密码')
    return
  }
  if (!loginForm.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }

  try {
    loading.value = true
    const data = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    if (!data.success) {
      ElMessage.error(data.msg || '登录失败')
      return
    }

    const token = data.data.token || ''
    setEmployeeToken(token)
    saveRemembered()
    ElMessage.success('登录成功')
    router.push('/employee/orders')
  } catch (error) {
    console.error('登录失败:', error)
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
</style>
```

- [ ] **Step 2: 验证页面**

```bash
cd /Users/pamrock/Antigravity/hs-employee && yarn dev
```

打开浏览器检查 `/employee/login` 视觉效果。

---

### Task 4: hs-employee 员工注册页

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-employee/src/views/employee/register.vue`

- [ ] **Step 1: 重写 register.vue，icon 和标题改为员工端专属**

模板结构与 Task 2 相同，区别：
- icon: `🧹`，标题: `员工注册`，副标题: `欢迎加入员工端服务平台`
- 路由跳转 `/employee/login`

完整代码：

```vue
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
```

- [ ] **Step 2: 验证页面**

在浏览器中导航到 `/employee/register`，确认视觉效果一致。

---

### Task 5: my-admin 管理端登录页

**Files:**
- Modify: `/Users/pamrock/Antigravity/my-admin/src/views/login/index.vue`

关键：保留现有的 el-form 表单验证逻辑（rules、formRef.validate）、Pinia store 登录、`router.push('/dashboard')`，仅替换 template 布局和 style。

- [ ] **Step 1: 重写 login/index.vue**

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { login } from '@/api/login'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

const rememberMe = ref(false)
const captchaPlaceholder = ref('')

onMounted(() => {
  if (route.query.session === 'expired') {
    ElMessage.error('登录状态已失效，请重新登录')
  }
  loadRemembered()
  refreshCaptcha()
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 15, message: '用户名长度 3 到 15 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度最少 6 个字符', trigger: 'blur' }
  ]
}

const formRef = ref()
const loading = ref(false)

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

const loadRemembered = () => {
  try {
    const saved = localStorage.getItem('admin_remember')
    if (saved) {
      const data = JSON.parse(saved)
      loginForm.username = data.username || ''
      loginForm.password = data.password || ''
      rememberMe.value = true
    }
  } catch (e) {
    localStorage.removeItem('admin_remember')
  }
}

const saveRemembered = () => {
  if (rememberMe.value) {
    localStorage.setItem('admin_remember', JSON.stringify({
      username: loginForm.username,
      password: loginForm.password
    }))
  } else {
    localStorage.removeItem('admin_remember')
  }
}

const handleLogin = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const loginData = {
      username: loginForm.username,
      password: loginForm.password
    }
    const { data } = await login(loginData)
    const token = data.token

    userStore.login(token)
    saveRemembered()
    ElMessage.success('登录成功')
    router.push('/dashboard')
    loading.value = false
  } catch (error) {
    loading.value = false
  }
}

const handleRegister = () => {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <div class="logo-icon">📊</div>
          <h1>家政经营管理系统</h1>
          <p class="subtitle">OPERATION CENTER</p>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="rules"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            clearable
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="loginForm.captcha"
              placeholder="验证码"
              :prefix-icon="Key"
              size="large"
              class="captcha-input"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <span class="captcha-placeholder">{{ captchaPlaceholder }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <el-link type="primary" @click="handleRegister">
          还没有账号？立即注册
        </el-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
  overflow: hidden;
  position: relative;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image:
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: #537fe7;
  top: -100px;
  right: -80px;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: #537fe7;
  bottom: -80px;
  left: -60px;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: #99b8ff;
  bottom: 180px;
  left: 40px;
  opacity: 0.04;
}

.login-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 400px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 36px 36px 28px;
  border: 1px solid rgba(255,255,255,0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 32px;
}

.login-header h1 {
  margin: 0;
  color: #1a1a2e;
  font-size: 18px;
  font-weight: 600;
}

.login-header .subtitle {
  font-size: 10px;
  color: #95a5a6;
  letter-spacing: 3px;
  margin: 0;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 100px;
  height: 40px;
  background: linear-gradient(135deg, #e8edf2, #d5dde5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

.captcha-placeholder {
  font-size: 18px;
  font-weight: bold;
  color: #1a1a2e;
  letter-spacing: 4px;
  font-style: italic;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  box-shadow: none !important;
  border-radius: 10px;
}

:deep(.el-input__prefix) {
  color: #b0b8c1;
}

.login-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(15,52,96,0.35);
}

.login-btn:hover {
  opacity: 0.9;
}

.login-footer {
  text-align: center;
  margin-top: 8px;
}
</style>
```

- [ ] **Step 2: 验证页面**

```bash
cd /Users/pamrock/Antigravity/my-admin && npm run dev
```

打开浏览器检查 `/login` 视觉效果：深蓝渐变背景、网格纹理、半透明圆点、毛玻璃白色卡片。

---

### Task 6: my-admin 管理端注册页

**Files:**
- Modify: `/Users/pamrock/Antigravity/my-admin/src/views/register/index.vue`

保留现有的 el-form 表单验证逻辑（rules、confirmPassword 验证器），仅替换 template 和 style。

- [ ] **Step 1: 重写 register/index.vue**

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const captchaPlaceholder = ref('')

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 15, message: '用户名长度 3 到 15 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度最少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const formRef = ref()
const loading = ref(false)

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
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    setTimeout(() => {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
      loading.value = false
    }, 1000)
  } catch (error) {
    loading.value = false
  }
}

const handleBackLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-background">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="register-card">
      <div class="register-header">
        <div class="logo">
          <div class="logo-icon">📊</div>
          <h1>注册账号</h1>
          <p class="subtitle">ADMIN REGISTER</p>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="registerForm"
        :rules="rules"
        @keyup.enter="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            type="email"
            placeholder="请输入邮箱地址"
            prefix-icon="Message"
            size="large"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            size="large"
            clearable
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            prefix-icon="Lock"
            size="large"
            clearable
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="captcha-row">
            <el-input
              v-model="registerForm.captcha"
              placeholder="验证码"
              prefix-icon="Key"
              size="large"
              class="captcha-input"
            />
            <div class="captcha-img" @click="refreshCaptcha">
              <span class="captcha-placeholder">{{ captchaPlaceholder }}</span>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            class="register-btn"
            :loading="loading"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '注 册' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="register-footer">
        <el-link type="primary" @click="handleBackLogin">
          已有账号？返回登录
        </el-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%);
  overflow: hidden;
  position: relative;
}

.register-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  opacity: 0.06;
  background-image:
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.06;
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: #537fe7;
  top: -100px;
  right: -80px;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: #537fe7;
  bottom: -80px;
  left: -60px;
}

.shape-3 {
  width: 250px;
  height: 250px;
  background: #99b8ff;
  bottom: 180px;
  left: 40px;
  opacity: 0.04;
}

.register-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  padding: 36px 36px 28px;
  border: 1px solid rgba(255,255,255,0.2);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 32px;
}

.register-header h1 {
  margin: 0;
  color: #1a1a2e;
  font-size: 18px;
  font-weight: 600;
}

.register-header .subtitle {
  font-size: 10px;
  color: #95a5a6;
  letter-spacing: 3px;
  margin: 0;
}

.captcha-row {
  display: flex;
  gap: 10px;
  width: 100%;
}

.captcha-input {
  flex: 1;
}

.captcha-img {
  width: 100px;
  height: 40px;
  background: linear-gradient(135deg, #e8edf2, #d5dde5);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  user-select: none;
}

.captcha-placeholder {
  font-size: 18px;
  font-weight: bold;
  color: #1a1a2e;
  letter-spacing: 4px;
  font-style: italic;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-input__wrapper) {
  background-color: #f5f7fa;
  box-shadow: none !important;
  border-radius: 10px;
}

:deep(.el-input__prefix) {
  color: #b0b8c1;
}

.register-btn {
  width: 100%;
  height: 42px;
  font-size: 15px;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1a1a2e, #0f3460);
  border: none;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(15,52,96,0.35);
}

.register-btn:hover {
  opacity: 0.9;
}

.register-footer {
  text-align: center;
  margin-top: 8px;
}
</style>
```

- [ ] **Step 2: 验证页面**

在浏览器中导航到 `/register`，确认视觉效果与登录页一致。

---

### 验证清单

全部完成后，三个项目分别启动开发服务器检查：

```bash
# 用户端
cd /Users/pamrock/Antigravity/hs-user && yarn dev
# 检查 /user/login 和 /user/register

# 员工端
cd /Users/pamrock/Antigravity/hs-employee && yarn dev
# 检查 /employee/login 和 /employee/register

# 管理端
cd /Users/pamrock/Antigravity/my-admin && npm run dev
# 检查 /login 和 /register
```

验证项目：
- [ ] 绿色渐变背景正常显示
- [ ] 装饰圆形位置正确
- [ ] 毛玻璃卡片效果（backdrop-filter）
- [ ] 验证码区域显示占位文字，点击刷新
- [ ] 记住密码复选框
- [ ] 表单输入、登录功能正常
- [ ] 管理端深蓝背景 + 网格纹理
- [ ] 管理端毛玻璃卡片
