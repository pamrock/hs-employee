<template>
  <div class="employee-register-container">
    <div class="register-header">
      <h2>员工注册</h2>
      <p>欢迎加入员工端服务平台</p>
    </div>

    <div class="register-form">
      <el-input
        v-model="registerForm.account"
        placeholder="请输入手机号或邮箱"
        class="mb-20 input-item"
        size="large"
      >
        <template #prefix>
          <el-icon><User /></el-icon>
        </template>
      </el-input>

      <el-input
        v-model="registerForm.username"
        placeholder="请输入用户名"
        class="mb-20 input-item"
        size="large"
      >
        <template #prefix>
          <el-icon><User /></el-icon>
        </template>
      </el-input>

      <el-input
        v-model="registerForm.password"
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
        class="register-btn"
        size="large"
        @click="handleRegister"
        :loading="loading"
      >
        {{ loading ? '注册中...' : '注 册' }}
      </el-button>

      <div class="links">
        <span @click="router.push('/employee/login')">已有账号？去登录</span>
      </div>
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

const registerForm = reactive({
  account: '',
  username: '',
  password: ''
})

const handleRegister = async () => {
  if (!registerForm.account || !registerForm.username || !registerForm.password) {
    ElMessage.warning('请填写完整注册信息')
    return
  }

  // 判断 account 是手机号还是邮箱
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.account)
  const isPhone = /^1[3-9]\d{9}$/.test(registerForm.account)

  if (!isEmail && !isPhone) {
    ElMessage.warning('请输入有效的手机号或邮箱')
    return
  }

  const data = {
    username: registerForm.username,
    password: registerForm.password,
    role: 2  // 可能需要根据员工角色调整
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
.employee-register-container {
  height: 100vh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background-color: #ffffff;
  padding: 40px 30px;
  box-sizing: border-box;
}

.register-header {
  margin-top: 60px;
  margin-bottom: 50px;
}

.register-header h2 {
  font-size: 28px;
  color: #333;
  margin: 0 0 10px 0;
}

.register-header p {
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

.register-btn {
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
  justify-content: center;
  margin-top: 20px;
  font-size: 14px;
  color: #1e3c72;
  cursor: pointer;
}
</style>