<template>
  <div class="employee-login-container">
    <div class="login-header">
      <h2>员工登录</h2>
      <p>家政服务平台</p>
    </div>

    <div class="login-form">
      <el-input
        v-model="loginForm.username"
        placeholder="请输入用户名/手机号/邮箱"
        class="mb-20 input-item"
        size="large"
      >
        <template #prefix>
          <el-icon><User /></el-icon>
        </template>
      </el-input>

      <el-input
        v-model="loginForm.password"
        type="password"
        placeholder="请输入密码"
        class="mb-20 input-item"
        show-password
        size="large"
      >
        <template #prefix>
          <el-icon><Lock /></el-icon>
        </template>
      </el-input>

      <el-button
        type="primary"
        class="login-btn"
        size="large"
        @click="handleLogin"
        :loading="loading"
      >
        {{ loading ? '登录中...' : '登 录' }}
      </el-button>

      <div class="links">
        <span @click="router.push('/employee/register')">注册账号</span>
        <span>忘记密码？</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login } from '@/api/login'
import { setEmployeeToken } from '@/utils/auth'

const router = useRouter()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const handleLogin = async () => {
  if (!loginForm.username || !loginForm.password) {
    ElMessage.warning('请输入用户名/手机号/邮箱和密码')
    return
  }

  try {
    loading.value = true
    const data = await login({
      username: loginForm.username,
      password: loginForm.password
    })

    // 存储员工 token
    if (!data.success) {
      ElMessage.error(data.msg || '登录失败')
      return
    }
    
    const token = data.data.token || ''
    setEmployeeToken(token)

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
.employee-login-container {
  height: 100vh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background-color: #ffffff;
  padding: 40px 30px;
  box-sizing: border-box;
}

.login-header {
  margin-top: 60px;
  margin-bottom: 50px;
}

.login-header h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 10px 0;
}

.login-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.mb-20 {
  margin-bottom: 20px;
}

/* 覆盖 Element Plus 默认样式，使其更像移动端输入框 */
:deep(.el-input__wrapper) {
  background-color: #f7f8fa;
  box-shadow: none !important;
  border-radius: 8px;
  padding: 0 15px;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #1e3c72 inset !important;
}

.login-btn {
  width: 100%;
  border-radius: 8px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border: none;
  font-size: 16px;
  margin-top: 10px;
  height: 44px;
}

.links {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  font-size: 14px;
  color: #1e3c72;
}

.links span {
  cursor: pointer;
}
</style>