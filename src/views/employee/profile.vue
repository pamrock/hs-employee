<template>
  <div class="profile-container" v-loading="loading">
    <div class="user-header">
      <el-avatar
        :size="68"
        :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0f1ac001e48612fc7f392099a41jpeg.jpeg'"
      />
      <div class="user-info">
        <h3>{{ userInfo.realName || userInfo.username || '员工用户' }}</h3>
        <p>{{ userInfo.phone || '未设置手机号' }}</p>
        <p>{{ userInfo.email || '未设置邮箱' }}</p>
      </div>
    </div>

    <div class="menu-list">
      <div class="menu-item" @click="showEditDrawer = true">
        <div class="menu-left">
          <el-icon class="menu-icon" color="#1e3c72"><Setting /></el-icon>
          <span>个人信息设置</span>
        </div>
        <el-icon color="#999"><ArrowRight /></el-icon>
      </div>
      <div class="menu-item" @click="showPasswordDialog = true">
        <div class="menu-left">
          <el-icon class="menu-icon" color="#1e3c72"><Lock /></el-icon>
          <span>修改密码</span>
        </div>
        <el-icon color="#999"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="logout-wrap">
      <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
    </div>

    <el-drawer
      v-model="showEditDrawer"
      direction="btt"
      size="78%"
      :with-header="false"
      class="edit-drawer"
      destroy-on-close
    >
      <div class="drawer-content">
        <h4>编辑个人信息</h4>

        <el-form ref="profileFormRef" :model="profileForm" :rules="profileRules" label-width="70px" class="profile-form">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              action="#"
              :show-file-list="false"
              :auto-upload="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <el-avatar
                :size="72"
                :src="profileForm.avatar || 'https://cube.elemecdn.com/0/88/03b0f1ac001e48612fc7f392099a41jpeg.jpeg'"
              />
              <div class="avatar-edit-hint">点击更换</div>
            </el-upload>
          </el-form-item>
          <el-form-item label="姓名" prop="realName">
            <el-input v-model="profileForm.realName" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="手机" prop="phone">
            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="性别" prop="gender">
            <el-select v-model="profileForm.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="未知" :value="0" />
              <el-option label="男" :value="1" />
              <el-option label="女" :value="2" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="drawer-actions">
          <el-button @click="showEditDrawer = false">取消</el-button>
          <el-button type="primary" :loading="savingProfile" @click="handleSaveProfile">保存</el-button>
        </div>
      </div>
    </el-drawer>

    <el-dialog v-model="showPasswordDialog" title="修改密码" width="92%" class="password-dialog">
      <el-form ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" label-width="75px">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请确认新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="savingPassword" @click="handleChangePassword">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ArrowRight, Lock, Setting } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserInfo, updatePassword, updateUserBySelf } from '@/api/user'
import { removeEmployeeToken } from '@/utils/auth'
import { updateEmployee } from '@/api/employee'

const router = useRouter()
const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const showEditDrawer = ref(false)
const showPasswordDialog = ref(false)
const uploadFile = ref(null)
const profileFormRef = ref(null)
const passwordFormRef = ref(null)

const userInfo = reactive({
  id: null,
  username: '',
  realName: '',
  phone: '',
  email: '',
  avatar: '',
  gender: 0
})

const profileForm = reactive({
  realName: '',
  phone: '',
  email: '',
  avatar: '',
  gender: 0
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const profileRules = {
  phone: [{
    validator: (rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (/^1[3-9]\d{9}$/.test(value)) {
        callback()
      } else {
        callback(new Error('请输入有效手机号'))
      }
    },
    trigger: 'blur'
  }],
  email: [{
    validator: (rule, value, callback) => {
      if (!value) {
        callback()
        return
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback()
      } else {
        callback(new Error('请输入正确邮箱'))
      }
    },
    trigger: ['blur', 'change']
  }]
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [{ required: true, validator: validatePass2, trigger: 'blur' }]
}

const syncProfileForm = () => {
  profileForm.realName = userInfo.realName || ''
  profileForm.phone = userInfo.phone || ''
  profileForm.email = userInfo.email || ''
  profileForm.avatar = userInfo.avatar || ''
  profileForm.gender = userInfo.gender ?? 0
  uploadFile.value = null
}

const loadUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo(3)
    if (res.success) {
      const data = res.data || {}
      userInfo.id = data.id || null
      userInfo.username = data.username || data.realName || '员工用户'
      userInfo.realName = data.realName || ''
      userInfo.phone = data.phone || ''
      userInfo.email = data.email || ''
      userInfo.avatar = data.avatar || ''
      userInfo.gender = data.gender ?? 0
      syncProfileForm()
    } else {
      ElMessage.error(res.msg || '获取用户信息失败')
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const handleAvatarChange = (file) => {
  profileForm.avatar = URL.createObjectURL(file.raw)
  uploadFile.value = file.raw
}

const handleSaveProfile = async () => {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return
    savingProfile.value = true
    try {
      if (uploadFile.value) {
        const avatarRes = await updateUserBySelf({ id: userInfo.id, username: userInfo.username }, uploadFile.value)
        if (!avatarRes.success) {
          ElMessage.error(avatarRes.msg || '头像更新失败')
          savingProfile.value = false
          return
        }
      }

      const updateRes = await updateEmployee({
        id: userInfo.id,
        realName: profileForm.realName,
        phone: profileForm.phone,
        email: profileForm.email,
        gender: profileForm.gender
      })
      if (updateRes.success) {
        ElMessage.success('个人信息更新成功')
        showEditDrawer.value = false
        await loadUserInfo()
      } else {
        ElMessage.error(updateRes.msg || '个人信息更新失败')
      }
    } catch (error) {
      ElMessage.error('个人信息更新失败')
    } finally {
      savingProfile.value = false
    }
  })
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return
    savingPassword.value = true
    try {
      const res = await updatePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      if (res.success) {
        ElMessage.success('密码修改成功，请重新登录')
        showPasswordDialog.value = false
        handleLogout()
      } else {
        ElMessage.error(res.msg || '修改密码失败')
      }
    } catch (error) {
      ElMessage.error('修改密码失败')
    } finally {
      savingPassword.value = false
    }
  })
}

const handleLogout = () => {
  removeEmployeeToken()
  ElMessage.success('已退出登录')
  router.push('/employee/login')
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 16px;
  background: #f7f8fa;
  min-height: calc(100vh - 84px);
}

.user-header {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.user-info h3 {
  margin: 0 0 6px;
  font-size: 17px;
  color: #1f2329;
}

.user-info p {
  margin: 0;
  color: #7c8698;
  font-size: 12px;
  line-height: 1.5;
}

.menu-list {
  background: #fff;
  border-radius: 14px;
  padding: 0 14px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1f2329;
  font-size: 15px;
}

.menu-icon {
  font-size: 18px;
}

.logout-wrap {
  margin-top: 20px;
}

.logout-btn {
  width: 100%;
  height: 44px;
  border-radius: 22px;
  color: #ff4d4f;
  border-color: #ff4d4f;
  background: #fff;
}

.drawer-content {
  padding: 14px;
}

.drawer-content h4 {
  margin: 0 0 12px;
  text-align: center;
  font-size: 16px;
}

.profile-form {
  margin-top: 8px;
}

.avatar-uploader {
  cursor: pointer;
  position: relative;
  display: inline-flex;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-edit-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

:deep(.edit-drawer.el-drawer.btt) {
  width: min(calc(100vw - 24px), 456px) !important;
  left: 0 !important;
  right: 0 !important;
  margin: 0 auto !important;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

:deep(.password-dialog .el-dialog) {
  max-width: 456px;
  border-radius: 12px;
}
</style>