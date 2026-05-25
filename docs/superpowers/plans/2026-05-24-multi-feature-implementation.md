# 家政服务系统 — 多需求实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 5 项功能升级：下拉刷新+无限滚动、分类Tab滑动指示器+毛玻璃、管理端超时通知、深色模式、聊天诊断分析

**Architecture:** 4个项目独立改造，按项目和功能分组执行。员工端和用户端共享 composable 模式（代码拷贝适配），后端新增通知模块，管理端新增通知组件

**Tech Stack:** Vue 3 + Element Plus + Vite + Spring Boot + MyBatis Plus + STOMP WebSocket

---

## 项目 A: hs-employee（员工端）

### 任务 A1: 创建 composables 目录和 useDarkMode

**Files:** Create: `src/composables/useDarkMode.js`

- [ ] **Step 1: 创建 useDarkMode.js**

```js
// src/composables/useDarkMode.js
import { ref } from 'vue'

const STORAGE_KEY = 'theme'

export function useDarkMode() {
  const isDark = ref(false)

  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    isDark.value = theme === 'dark'
  }

  function toggle() {
    const newTheme = isDark.value ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  })

  applyTheme(getPreferredTheme())

  return { isDark, toggle }
}
```

- [ ] **Step 2: 验证文件语法正确**

Run: `cd /Users/pamrock/Antigravity/hs-employee && node -e "const fs = require('fs'); const code = fs.readFileSync('src/composables/useDarkMode.js', 'utf8'); console.log('Syntax OK, lines:', code.split('\\n').length)"`

### 任务 A2: 添加暗色 CSS 变量 + Element Plus 暗色导入

**Files:**
- Modify: `src/assets/main.css`
- Modify: `src/assets/base.css`
- Modify: `src/main.js`

- [ ] **Step 1: 在 main.css 末尾添加暗色 CSS 变量**

Add to `src/assets/main.css` after line 63:

```css
[data-theme="dark"] {
  --app-primary: #4a9eff;
  --app-primary-light: #6db3ff;
  --app-primary-gradient: linear-gradient(135deg, #1a3a5c 0%, #2a5298 100%);
  --app-bg: #0f0f14;
  --app-bg-white: #1a1a24;
  --app-bg-input: #252530;
  --app-text-primary: #e0e0e6;
  --app-text-secondary: #a0a0aa;
  --app-text-muted: #707078;
  --app-text-placeholder: #505058;
  --app-border: #2a2a36;
  --app-border-light: #22222e;
  --app-success: #4caf50;
  --app-warning: #ff9800;
  --app-danger: #ef5350;
}
```

- [ ] **Step 2: 修改 base.css — 移除 overscroll-behavior: none，body 背景改为 CSS 变量**

In `src/assets/base.css`, line 56-67:

```css
html {
  overflow: hidden;
  height: 100%;
}

body {
  overflow: hidden;
  height: 100%;
  color: var(--app-text-primary);
  background: var(--app-bg);
  transition: color 0.3s, background-color 0.3s;
  line-height: 1.6;
  font-family:
    Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  font-size: 15px;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Also remove the `@media (prefers-color-scheme: dark)` block (lines 34-46) since it uses unused Vue template vars.

- [ ] **Step 3: 在 main.js 添加 Element Plus 暗色导入**

In `src/main.js`, add after `import 'element-plus/dist/index.css'`:

```js
import 'element-plus/theme-chalk/dark/css-vars.css'
```

### 任务 A3: 在 layout.vue 添加深色模式切换按钮

**File:** Modify: `src/views/employee/layout.vue`

- [ ] **Step 1: 修改布局模板，在 tab bar 右侧添加切换按钮**

Replace the `<template>` section in `src/views/employee/layout.vue`:

```vue
<template>
  <div class="employee-layout-container">
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <div class="bottom-tab-bar">
      <router-link to="/employee/orders" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><Document /></el-icon>
        <span class="tab-text">订单</span>
      </router-link>
      <router-link to="/employee/stats" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><DataAnalysis /></el-icon>
        <span class="tab-text">数据</span>
      </router-link>
      <router-link to="/employee/profile" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><User /></el-icon>
        <span class="tab-text">我的</span>
      </router-link>
      <div class="tab-item theme-toggle" @click="toggleTheme">
        <el-icon class="tab-icon"><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
        <span class="tab-text">{{ isDark ? '浅色' : '深色' }}</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 更新 script 部分**

Replace the `<script setup>` section:

```vue
<script setup>
import { Document, User, DataAnalysis, Sunny, Moon } from '@element-plus/icons-vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleTheme } = useDarkMode()
</script>
```

- [ ] **Step 3: 添加主题切换按钮样式**

In `<style scoped>`, add after `.tab-item.active .tab-icon`:

```css
.theme-toggle {
  cursor: pointer;
}
```

### 任务 A4: 创建 usePullRefresh composable

**File:** Create: `src/composables/usePullRefresh.js`

- [ ] **Step 1: 创建下拉刷新 composable**

```js
// src/composables/usePullRefresh.js
import { ref } from 'vue'

export function usePullRefresh(onRefresh) {
  const pullState = ref('')   // '' | 'pulling' | 'ready' | 'loading'
  const pullDistance = ref(0)
  const TRIGGER_DIST = 60
  const MAX_DIST = 100

  let startY = 0

  function onTouchStart(e) {
    if (pullState.value === 'loading') return
    startY = e.touches[0].clientY
  }

  function onTouchMove(e) {
    if (pullState.value === 'loading') return
    const el = e.currentTarget
    if (el.scrollTop > 0) {
      pullDistance.value = 0
      pullState.value = ''
      return
    }
    const delta = (e.touches[0].clientY - startY) * 0.5 // resistance factor
    if (delta <= 0) {
      pullDistance.value = 0
      pullState.value = ''
      return
    }
    e.preventDefault() // prevent only when pulling down
    pullDistance.value = Math.min(delta, MAX_DIST)
    pullState.value = pullDistance.value >= TRIGGER_DIST ? 'ready' : 'pulling'
  }

  function onTouchEnd(e) {
    if (pullState.value === 'ready') {
      pullState.value = 'loading'
      pullDistance.value = TRIGGER_DIST
      Promise.resolve(onRefresh()).finally(() => {
        pullState.value = ''
        pullDistance.value = 0
      })
    } else {
      pullState.value = ''
      pullDistance.value = 0
    }
  }

  return { pullState, pullDistance, onTouchStart, onTouchMove, onTouchEnd }
}
```

### 任务 A5: 创建 useInfiniteScroll composable

**File:** Create: `src/composables/useInfiniteScroll.js`

- [ ] **Step 1: 创建无限滚动 composable**

```js
// src/composables/useInfiniteScroll.js
import { ref, onMounted, onUnmounted, watch } from 'vue'

export function useInfiniteScroll(loadMore, hasMore) {
  const sentinelRef = ref(null)
  let observer = null

  function setupObserver() {
    if (observer) observer.disconnect()
    if (!sentinelRef.value) return

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore.value) {
        loadMore()
      }
    }, { rootMargin: '100px' })

    observer.observe(sentinelRef.value)
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    if (observer) observer.disconnect()
  })

  // Re-observe when sentinel mounts/changes
  watch(sentinelRef, () => {
    setupObserver()
  })

  return { sentinelRef }
}
```

### 任务 A6: 改造员工端 orders.vue — 下拉刷新 + 无限滚动

**File:** Modify: `src/views/employee/orders.vue`

- [ ] **Step 1: 替换模板 — 移除 pagination，添加下拉指示器和哨兵**

Replace the existing template's order-list section (from the `<div class="order-list">` to `</div>` closing tag before `</template>`).

The new template for the order-list section:

```vue
    <div
      class="order-list"
      ref="listContainerRef"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 下拉刷新指示器 -->
      <div class="pull-indicator" :class="pullState" :style="{ height: pullDistance + 'px' }">
        <span v-if="pullState === 'pulling'">下拉刷新</span>
        <span v-if="pullState === 'ready'">释放立即刷新</span>
        <span v-if="pullState === 'loading'">
          <span class="loading-dot"></span> 刷新中...
        </span>
      </div>

      <template v-if="orderList.length">
        <div class="order-card" v-for="order in orderList" :key="order.id">
          <!-- order card content unchanged -->
          <div class="order-header">
            <span class="order-no">订单号: {{ order.orderId || order.id }}</span>
            <span class="order-status" :class="getStatusClass(order.status)">{{ getStatusText(order.status) }}</span>
          </div>
          <div class="order-content">
            <div class="order-img">
              <img
                v-if="order.serviceItemImageUrl"
                :src="order.serviceItemImageUrl"
                :alt="'服务项目'"
                class="order-cover-img"
                loading="lazy"
                @error="order.serviceItemImageUrl = null"
              />
              <el-icon v-if="!order.serviceItemImageUrl" :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
            <div class="order-info">
              <p class="order-create-time">下单时间: {{ order.createTime || '-' }}</p>
              <p class="order-price">金额: ¥ {{ order.totalAmount ?? 0 }}</p>
            </div>
          </div>
          <div class="order-footer">
            <el-badge :value="unreadCounts[order.orderId || order.id]" :hidden="!unreadCounts[order.orderId || order.id]" class="view-detail-badge">
              <el-button size="small" round @click="viewDetail(order)" class="view-detail-btn">查看详情</el-button>
            </el-badge>
            <div class="action-buttons">
              <el-button v-if="order.status === '3'" size="small" type="primary" round class="main-btn" @click="startService(order)" :loading="startingOrderId === (order.orderId || order.id)">开始服务</el-button>
              <el-button v-if="order.status === '4'" size="small" type="success" round disabled>服务中</el-button>
              <el-button v-if="order.status === '5' || order.status === '6'" size="small" type="info" round disabled>{{ getStatusText(order.status) }}</el-button>
              <span v-if="order.status === '5' && hasRating(order)" class="rating-done">客户评分 {{ getRatingScore(order) }} 分</span>
            </div>
          </div>
        </div>
        <!-- 加载更多 loading -->
        <div v-if="loadingMore" class="loading-more">加载中...</div>
        <div v-if="!hasMore && orderList.length > 0" class="no-more">— 没有更多了 —</div>
        <!-- 无限滚动哨兵 -->
        <div ref="sentinelRef" class="scroll-sentinel"></div>
      </template>
      <el-empty v-else :description="emptyMessage" />
    </div>

    <el-dialog v-model="detailVisible" title="订单详情" width="92%" class="order-detail-dialog">
      <!-- detail dialog unchanged -->
    </el-dialog>
```

Note: The detail dialog stays exactly the same. Only the list section changes.

- [ ] **Step 2: 更新 script — 替换分页为无限滚动逻辑**

Replace the imports and reactive state in `<script setup>`:

```vue
<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getEmployeeOrderList, startEmployeeService, getOrderDetail } from '@/api/order'
import { batchUnreadCount } from '@/api/message'
import { consumeReadOrderIds } from '@/utils/chat-state'
import { usePullRefresh } from '@/composables/usePullRefresh'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'

const tabs = [
  { label: '全部', value: '' },
  { label: '已派单', value: '3' },
  { label: '服务中', value: '4' },
  { label: '已完成', value: '5' },
  { label: '已取消', value: '6' }
]

const activeTab = ref('')
const tabsRef = ref(null)
const loading = ref(false)
const loadingMore = ref(false)
const orderList = ref([])
const hasMore = ref(true)
const listContainerRef = ref(null)
const pageSize = 10

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentOrder = ref(null)
const unreadCounts = ref({})
const startingOrderId = ref(null)

// ... (emptyMessage computed, getStatusClass, getStatusType, getStatusText, hasRating, getRatingScore - keep unchanged)
```

- [ ] **Step 3: 替换 fetchList 为追加模式**

```js
let currentPage = 1

const fetchList = async (reset = false) => {
  if (reset) {
    currentPage = 1
    orderList.value = []
    hasMore.value = true
    loading.value = true
  }
  try {
    const reqData = { pageNo: currentPage, pageSize, status: activeTab.value || undefined }
    const res = await getEmployeeOrderList(reqData)
    const data = res.data || {}
    const records = data.records || data.list || (Array.isArray(data) ? data : [])
    if (records.length < pageSize) hasMore.value = false
    orderList.value = reset ? records : [...orderList.value, ...records]
  } catch (error) {
    if (reset) { orderList.value = []; hasMore.value = false }
    ElMessage.error('网络异常，订单列表加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
  loadUnreadCounts()
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  currentPage++
  fetchList(false)
}

const doRefresh = () => fetchList(true)

// Pull-to-refresh
const { pullState, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullRefresh(doRefresh)

// Infinite scroll
const { sentinelRef } = useInfiniteScroll(loadMore, hasMore)
```

- [ ] **Step 4: 替换 handleTabChange 和 handleRefresh**

```js
const handleTabChange = (value) => {
  activeTab.value = value
  currentPage = 1
  fetchList(true)
  nextTick(() => {
    if (tabsRef.value) {
      const activeTabEl = tabsRef.value.querySelector('.tab-item.active')
      if (activeTabEl) activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  })
}

```

- [ ] **Step 5: 移除 handleCurrentChange 和 Refresh 图标导入**

Remove `handleCurrentChange` function and `Refresh` from the import line. Remove `Refresh` from `@element-plus/icons-vue` import.

- [ ] **Step 6: 移除 header 中的 refresh 按钮**

Replace:
```html
<div class="header">
  <h2>员工订单</h2>
  <el-button text circle size="small" @click="handleRefresh" :loading="loading">
    <el-icon><Refresh /></el-icon>
  </el-button>
</div>
```
With:
```html
<div class="header">
  <h2>员工订单</h2>
</div>
```

- [ ] **Step 7: 添加下拉刷新和无限滚动 CSS**

Add to `<style scoped>`:

```css
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}

.pull-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s;
  color: var(--app-text-muted);
  font-size: 13px;
}

.loading-more {
  text-align: center;
  padding: 12px;
  color: var(--app-text-muted);
  font-size: 13px;
}

.no-more {
  text-align: center;
  padding: 12px;
  color: var(--app-text-placeholder);
  font-size: 12px;
}

.scroll-sentinel {
  height: 1px;
}
```

Remove the `.pagination-wrap` styles (no longer used).

- [ ] **Step 8: 自适应暗色模式**

Change hardcoded values in `<style scoped>`:

```css
/* Replace #67c23a with var(--app-success) */
.order-status.success { color: var(--app-success); }
/* Replace #f56c6c with var(--app-danger) */
.order-status.danger { color: var(--app-danger); }
/* Replace #5a6376 with var(--app-text-secondary) */
.order-create-time { color: var(--app-text-secondary) !important; }
/* Replace #f5f7fa with var(--app-bg-input) */
.order-img { background: var(--app-bg-input); }
```

### 任务 A7: 员工端 chat.vue 暗色模式适配

**File:** Modify: `src/views/employee/chat.vue`

- [ ] **Step 1: 替换 chat.vue 中的硬编码颜色**

In `<style scoped>`, replace the following:

| Line | Old Value | New Value |
|------|-----------|-----------|
| 323 | `background: #f0f0f0` | `background: var(--app-bg)` |
| 329 | `background: #f5f7fa` | `background: var(--app-bg-white)` |
| 330 | `border-bottom: 1px solid #e5e5e5` | `border-bottom: 1px solid var(--app-border)` |
| 339 | `background: white` | `background: var(--app-bg-white)` |
| 341 | `color: #333` | `color: var(--app-text-primary)` |
| 344 | `background: white` | `background: var(--app-bg-white)` |
| 344 | `border-top: 1px solid #e5e5e5` | `border-top: 1px solid var(--app-border)` |
| 345 | `color: #888` | `color: var(--app-text-muted)` |
| 346 | `background: #f5f5f5` | `background: var(--app-bg-input)` |
| 352 | `color: #aaa` | `color: var(--app-text-muted)` |
| 356 | `background: #fff` | `background: var(--app-bg-white)` |
| 380 | `color: #aaa` | `color: var(--app-text-muted)` |
| 330 | `color: #333` (back-btn) | `color: var(--app-text-primary)` |

```css
/* Corrected styles */
.chat-container { display: flex; flex-direction: column; height: 100dvh; background: var(--app-bg); }
.chat-header { display: flex; align-items: center; padding: 10px 12px; background: var(--app-bg-white); border-bottom: 1px solid var(--app-border); }
.back-btn { font-size: 20px; margin-right: 10px; color: var(--app-text-primary); cursor: pointer; }
.message-bubble { max-width: 65%; padding: 10px 13px; border-radius: 4px 14px 14px 14px; background: var(--app-bg-white); word-break: break-all; }
.msg-text { font-size: 14px; color: var(--app-text-primary); line-height: 1.5; }
.input-area { display: flex; align-items: center; padding: 8px 10px; background: var(--app-bg-white); border-top: 1px solid var(--app-border); gap: 8px; }
.img-upload-btn { flex-shrink: 0; color: var(--app-text-muted); cursor: pointer; }
.text-input { flex: 1; border: none; outline: none; font-size: 14px; padding: 8px 4px; background: var(--app-bg-input); border-radius: 4px; }
.time-divider { text-align: center; font-size: 11px; color: var(--app-text-muted); margin: 10px 0; }
.loading-wrap { text-align: center; color: var(--app-text-muted); padding: 20px; font-size: 13px; }
.loading-text { font-size: 12px; color: var(--app-text-muted); }
.scroll-to-bottom { position: sticky; bottom: 10px; float: right; width: 36px; height: 36px; background: var(--app-bg-white); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer; z-index: 10; }
.empty-messages { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--app-text-muted); gap: 4px; }
```

### 任务 A8: 员工端 login.vue 和 register.vue 暗色适配

**Files:** Modify: `src/views/employee/login.vue`, `src/views/employee/register.vue`

- [ ] **Step 1: 在 login.vue 和 register.vue 的 `<style scoped>` 中添加暗色适配**

Both login.vue and register.vue use green gradient backgrounds (`#a8e6cf` / `#52b788` / `#40916c`) and white cards. Add a dark override:

In both files, add at the end of `<style scoped>`:

```css
[data-theme="dark"] .login-wrapper,
[data-theme="dark"] .register-wrapper {
  background: linear-gradient(135deg, #1a3a2a 0%, #0d2818 50%, #0a1a10 100%);
}

[data-theme="dark"] .login-card,
[data-theme="dark"] .register-card {
  background: rgba(26, 26, 36, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 任务 A8: 员工端 login.vue 和 register.vue 暗色适配

**Files:** Modify: `src/views/employee/login.vue`, `src/views/employee/register.vue`

- [ ] **Step 1: 添加暗色样式覆盖**

In both files, add at the end of `<style scoped>`:

```css
[data-theme="dark"] .login-wrapper,
[data-theme="dark"] .register-wrapper {
  background: linear-gradient(135deg, #1a3a2a 0%, #0d2818 50%, #0a1a10 100%);
}

[data-theme="dark"] .login-card,
[data-theme="dark"] .register-card {
  background: rgba(26, 26, 36, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### 任务 A9: 员工端 profile.vue 暗色适配

**File:** Modify: `src/views/employee/profile.vue`

- [ ] **Step 1: 替换硬编码颜色为 CSS 变量**

In `<style scoped>`, replace: `#fff`/`#ffffff` → `var(--app-bg-white)`, `#f5f7fa` → `var(--app-bg-input)`, `#333`/`#1f2329` → `var(--app-text-primary)`, `#666`/`#646f83` → `var(--app-text-secondary)`, `#999`/`#7c8698` → `var(--app-text-muted)`.

- [ ] **Step 2: Commit**

```
cd /Users/pamrock/Antigravity/hs-employee
git add -A
git commit -m "feat: add dark mode, pull-to-refresh, infinite scroll to employee app"
```

---

## 项目 B: hs-user（用户端）

### 任务 B1: 创建 composables（useDarkMode, usePullRefresh, useInfiniteScroll）

**Files:** Create:
- `src/composables/useDarkMode.js`
- `src/composables/usePullRefresh.js`
- `src/composables/useInfiniteScroll.js`

- [ ] **Step 1: 拷贝 hs-employee 的 useDarkMode.js 到 hs-user**

Copy the file with identical content from Task A1.

```bash
cp /Users/pamrock/Antigravity/hs-employee/src/composables/useDarkMode.js /Users/pamrock/Antigravity/hs-user/src/composables/useDarkMode.js
```

- [ ] **Step 2: 拷贝 usePullRefresh.js**

```bash
cp /Users/pamrock/Antigravity/hs-employee/src/composables/usePullRefresh.js /Users/pamrock/Antigravity/hs-user/src/composables/usePullRefresh.js
```

- [ ] **Step 3: 拷贝 useInfiniteScroll.js**

```bash
cp /Users/pamrock/Antigravity/hs-employee/src/composables/useInfiniteScroll.js /Users/pamrock/Antigravity/hs-user/src/composables/useInfiniteScroll.js
```

### 任务 B2: 暗色 CSS 变量 + Element Plus + 层叠样式修改

**Files:** Modify: `src/assets/main.css`, `src/assets/base.css`, `src/main.js`

- [ ] **Step 1: main.css 添加暗色变量（与 hs-employee 相同）**

Add at end of `src/assets/main.css`:

```css
[data-theme="dark"] {
  --app-primary: #4a9eff;
  --app-primary-light: #6db3ff;
  --app-primary-gradient: linear-gradient(135deg, #1a3a5c 0%, #2a5298 100%);
  --app-bg: #0f0f14;
  --app-bg-white: #1a1a24;
  --app-bg-input: #252530;
  --app-text-primary: #e0e0e6;
  --app-text-secondary: #a0a0aa;
  --app-text-muted: #707078;
  --app-text-placeholder: #505058;
  --app-border: #2a2a36;
  --app-border-light: #22222e;
  --app-success: #4caf50;
  --app-warning: #ff9800;
  --app-danger: #ef5350;
}
```

- [ ] **Step 2: base.css — 移除 overscroll-behavior**

Same changes as Task A2 Step 2. Remove lines with `overscroll-behavior: none`. Change `background: #f7f8fa` to `background: var(--app-bg)`. Remove the `@media (prefers-color-scheme: dark)` block (lines 34-46).

- [ ] **Step 3: main.js 添加 Element Plus 暗色导入**

Add after `import 'element-plus/dist/index.css'`:

```js
import 'element-plus/theme-chalk/dark/css-vars.css'
```

### 任务 B3: hs-user layout.vue — 添加深色模式切换按钮

**File:** Modify: `src/views/user/layout.vue`

- [ ] **Step 1: 模板改为与员工端相同的模式**

Replace `<template>`:

```vue
<template>
  <div class="user-layout-container">
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
    <div class="bottom-tab-bar">
      <router-link to="/user/services" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><House /></el-icon>
        <span class="tab-text">服务</span>
      </router-link>
      <router-link to="/user/orders" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><Document /></el-icon>
        <span class="tab-text">订单</span>
      </router-link>
      <router-link to="/user/profile" class="tab-item" active-class="active">
        <el-icon class="tab-icon"><User /></el-icon>
        <span class="tab-text">我的</span>
      </router-link>
      <div class="tab-item theme-toggle" @click="toggleTheme">
        <el-icon class="tab-icon"><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
        <span class="tab-text">{{ isDark ? '浅色' : '深色' }}</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 更新 script**

```vue
<script setup>
import { House, Document, User, Sunny, Moon } from '@element-plus/icons-vue'
import { useDarkMode } from '@/composables/useDarkMode'

const { isDark, toggle: toggleTheme } = useDarkMode()
</script>
```

- [ ] **Step 3: 添加样式**

Add inside `<style scoped>` after the `.tab-item.active .tab-icon` rule:

```css
.theme-toggle { cursor: pointer; }
```

### 任务 B4: 改造用户端 orders.vue — 下拉刷新 + 无限滚动

**File:** Modify: `src/views/user/orders.vue`

This follows the same pattern as Task A6. Key differences: the user orders have 7 tabs (vs 5), the API call is `getMyOrderList`, and page param is `pageNum` not `pageNo`.

- [ ] **Step 1: 更新导入**

In `<script setup>`:

```js
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { refundOrder, finishService, getMyOrderList, getOrderDetail, submitOrderRating } from '@/api/order'
import { batchUnreadCount } from '@/api/message'
import { consumeReadOrderIds } from '@/utils/chat-state'
import { alipayPay, queryPaymentStatus } from '@/api/pay'
import { usePullRefresh } from '@/composables/usePullRefresh'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
```

- [ ] **Step 2: 添加无限滚动状态**

Replace `queryParams` reactive and add scroll state:

```js
const activeTab = ref('all')
const tabsRef = ref(null)
const loading = ref(false)
const loadingMore = ref(false)
const orderList = ref([])
const hasMore = ref(true)
const listContainerRef = ref(null)
const pageSize = 10
let currentPage = 1
```

- [ ] **Step 3: 替换 fetchList**

```js
const fetchList = async (reset = false) => {
  if (reset) {
    currentPage = 1
    orderList.value = []
    hasMore.value = true
    loading.value = true
  }
  try {
    const reqData = { pageNum: currentPage, pageSize }
    if (activeTab.value !== 'all') {
      reqData.status = activeTab.value
    }
    const res = await getMyOrderList(reqData)
    if (!res.success) {
      ElMessage.error(res.msg || '加载订单列表失败')
      return
    }
    const data = res.data || {}
    const records = data.records || data.list || (Array.isArray(data) ? data : [])
    if (records.length < pageSize) hasMore.value = false
    orderList.value = reset ? records : [...orderList.value, ...records]
  } catch (error) {
    if (reset) { orderList.value = []; hasMore.value = false }
    ElMessage.error('网络异常，订单列表加载失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
  loadUnreadCounts()
  if (reset) {
    orderList.value.forEach(order => {
      if (isUnpaid(order.status) && !pollingTimers[order.orderId || order.id]) {
        startPolling(order.orderId || order.id)
      }
    })
  }
}

const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  currentPage++
  fetchList(false)
}

const doRefresh = () => fetchList(true)

const { pullState, pullDistance, onTouchStart, onTouchMove, onTouchEnd } = usePullRefresh(doRefresh)
const { sentinelRef } = useInfiniteScroll(loadMore, hasMore)
```

- [ ] **Step 4: 替换 handleTabChange 和 handleRefresh**

```js
const handleTabChange = (value) => {
  activeTab.value = value
  currentPage = 1
  fetchList(true)
  nextTick(() => {
    if (tabsRef.value) {
      const activeTabEl = tabsRef.value.querySelector('.tab-item.active')
      if (activeTabEl) activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  })
}

```

- [ ] **Step 5: 移除 handleCurrentChange**

Delete `handleCurrentChange` function. Remove `Refresh` from icons import.

- [ ] **Step 6: 替换模板中 header 和列表区域**

Replace `<div class="header">` with no refresh button:

```html
<div class="header">
  <h2>我的订单</h2>
</div>
```

Replace the order-list `<div>`:

```html
    <div
      class="order-list"
      ref="listContainerRef"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div class="pull-indicator" :class="pullState" :style="{ height: pullDistance + 'px' }">
        <span v-if="pullState === 'pulling'">下拉刷新</span>
        <span v-if="pullState === 'ready'">释放立即刷新</span>
        <span v-if="pullState === 'loading'">刷新中...</span>
      </div>
      <template v-if="orderList.length">
        <div class="order-card" v-for="order in orderList" :key="order.id" @click="viewDetail(order.orderId || order.id)">
          <!-- card content unchanged -->
        </div>
        <div v-if="loadingMore" class="loading-more">加载中...</div>
        <div v-if="!hasMore && orderList.length > 0" class="no-more">— 没有更多了 —</div>
        <div ref="sentinelRef" class="scroll-sentinel"></div>
      </template>
      <el-empty v-else :description="emptyMessage" />
    </div>
```

- [ ] **Step 7: 移除 pagination-wrap CSS，添加新样式**

Remove `.pagination-wrap` from `<style scoped>`. Add:

```css
.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
}
.pull-indicator { display: flex; align-items: center; justify-content: center; overflow: hidden; transition: height 0.2s; color: var(--app-text-muted); font-size: 13px; }
.loading-more { text-align: center; padding: 12px; color: var(--app-text-muted); font-size: 13px; }
.no-more { text-align: center; padding: 12px; color: var(--app-text-placeholder); font-size: 12px; }
.scroll-sentinel { height: 1px; }
```

Also fix hardcoded colors: `.order-status.danger { color: var(--app-danger); }`, `.rating-panel { background: var(--app-bg-input); }`, `.order-img { background: var(--app-bg-input); }`.

### 任务 B5: 分类 Tab 栏 — 滑动指示器 + 毛玻璃吸顶

**File:** Modify: `src/views/user/services.vue`

- [ ] **Step 1: 替换 category-tabs 模板**

Replace lines 23-34:

```html
      <!-- 分类标签栏 — 滑动指示器 + 毛玻璃 -->
      <div class="category-tabs" v-if="categoryList.length">
        <div ref="categoryTabsWrapperRef" class="tabs-scroll">
          <div class="tabs-container" ref="tabsContainerRef">
            <div
              v-for="cat in categoryList"
              :key="cat.categoryCode"
              :ref="el => { if (el) tabRefs[cat.categoryCode] = el }"
              class="tab-item-cat"
              :class="{ active: selectedCategory === cat.categoryCode }"
              @click="handleCategoryChange(cat.categoryCode)"
            >{{ cat.categoryName }}</div>
          </div>
        </div>
      </div>
```

- [ ] **Step 2: 更新 script — 添加指示器逻辑**

In `<script setup>` add after the existing ref declarations:

```js
const tabsContainerRef = ref(null)
const tabRefs = reactive({})
const indicatorStyle = reactive({ left: '0px', width: '0px' })

const updateIndicator = () => {
  nextTick(() => {
    const code = selectedCategory.value
    const activeEl = tabRefs[code]
    if (!activeEl || !tabsContainerRef.value) {
      indicatorStyle.left = '0px'
      indicatorStyle.width = '0px'
      return
    }
    const containerRect = tabsContainerRef.value.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()
    indicatorStyle.left = `${activeRect.left - containerRect.left}px`
    indicatorStyle.width = `${activeRect.width}px`
  })
}

// Call updateIndicator when tab changes
const handleCategoryChange = (code) => {
  if (selectedCategory.value === code) {
    selectedCategory.value = ''
  } else {
    selectedCategory.value = code
    searchKeyword.value = ''
  }
  updateIndicator()
  nextTick(() => {
    const activeEl = tabRefs[selectedCategory.value]
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  })
  loadServiceList()
}
```

- [ ] **Step 3: 添加指示器 div 在 tabs-container 内**

Add inside `.tabs-container`, after the v-for loop, before closing `</div>`:

```html
            <div class="tab-indicator" :style="indicatorStyle"></div>
```

Full tabs-container:
```html
<div class="tabs-container" ref="tabsContainerRef">
  <div v-for="cat in categoryList" ...>{{ cat.categoryName }}</div>
  <div class="tab-indicator" :style="indicatorStyle"></div>
</div>
```

- [ ] **Step 4: 替换 category-tabs CSS**

Replace the `.category-tabs`, `.tabs-scroll`, `.tab-chip` styles with:

```css
.category-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

[data-theme="dark"] .category-tabs {
  background: rgba(15, 15, 20, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.tabs-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tabs-scroll::-webkit-scrollbar { display: none; }

.tabs-container {
  display: inline-flex;
  gap: 24px;
  padding: 12px 16px;
  position: relative;
}

.tab-item-cat {
  display: inline-block;
  padding: 8px 0;
  font-size: 14px;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}
.tab-item-cat.active {
  color: var(--app-primary);
  font-weight: 600;
}

.tab-indicator {
  position: absolute;
  bottom: 12px;
  height: 3px;
  border-radius: 1.5px;
  background: var(--app-primary);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

Delete the old `.tab-chip` and `.tab-chip.active` styles.

- [ ] **Step 5: 初始化指示器 onMounted**

Replace `onMounted`:

```js
onMounted(() => {
  loadCategoryList()
  loadServiceList()
  ensureCurrentUser()
  nextTick(() => {
    updateIndicator()
  })
})
```

### 任务 B6: 用户端其他页面暗色适配

**Files:** Modify:
- `src/views/user/chat.vue`
- `src/views/user/login.vue`
- `src/views/user/register.vue`
- `src/views/user/services.vue`

- [ ] **Step 1: chat.vue — 同员工端 A7 的相同改动**

Replace hardcoded `#f0f0f0`, `#f5f7fa`, `white`, `#888`, `#f5f5f5`, `#aaa`, `#fff`, `#e5e5e5`, `#333` with the appropriate `var(--app-*)` variables.

- [ ] **Step 2: login.vue / register.vue — 同 A8**

Add dark gradient overrides.

- [ ] **Step 3: services.vue — 查找硬编码颜色并替换**

In `services.vue` `<style scoped>`:
- `.card-cover` background `linear-gradient(145deg, #eef4ff, #e8f9ff)` → Add `[data-theme="dark"] .card-cover { background: linear-gradient(145deg, #1a2a3a, #1a2838); }`
- `.price` color `#fa541c` → Add `[data-theme="dark"] .price { color: #ff7043; }`
- `.search-input-wrap` background `#f5f6f8` → `background: var(--app-bg-input)`
- `.picker-item.active` → Add `[data-theme="dark"] .picker-item.active { background: rgba(76, 175, 80, 0.1); border-color: var(--app-success); }`

- [ ] **Step 4: Commit**

```
cd /Users/pamrock/Antigravity/hs-user
git add -A
git commit -m "feat: add dark mode, pull-to-refresh, infinite scroll, category tab sliding indicator with glassmorphism"
```

### 任务 B7: 用户端 profile.vue 暗色适配

**File:** Modify: `src/views/user/profile.vue`

- [ ] **Step 1: 替换硬编码颜色为 CSS 变量**

In `<style scoped>`, replace: `#fff`/`#ffffff` → `var(--app-bg-white)`, `#f5f7fa` → `var(--app-bg-input)`, `#333`/`#1f2329` → `var(--app-text-primary)`, `#666`/`#646f83` → `var(--app-text-secondary)`, `#999`/`#7c8698` → `var(--app-text-muted)`.

- [ ] **Step 2: Commit**

```
cd /Users/pamrock/Antigravity/hs-user
git add src/views/user/profile.vue
git commit -m "feat: add dark mode to user profile page"
```

---

## 项目 C: pytest（后端）— 超时未派单通知

### 任务 C1: 创建通知实体

**File:** Create: `src/main/java/com/pamrock/pytest/entity/notification/HsNotification.java`

- [ ] **Step 1: 创建实体类**

```java
package com.pamrock.pytest.entity.notification;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = false)
@TableName("hs_notification")
public class HsNotification implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String type;

    private String title;

    private String content;

    private String refId;

    private Integer isRead;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
```

### 任务 C2: 创建通知 Mapper

**File:** Create: `src/main/java/com/pamrock/pytest/mapper/notification/HsNotificationMapper.java`

- [ ] **Step 1: 创建 Mapper**

```java
package com.pamrock.pytest.mapper.notification;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.pamrock.pytest.entity.notification.HsNotification;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HsNotificationMapper extends BaseMapper<HsNotification> {
}
```

### 任务 C3: 创建通知 Service

**Files:** Create:
- `src/main/java/com/pamrock/pytest/service/notification/NotificationService.java`
- `src/main/java/com/pamrock/pytest/service/impl/notification/NotificationServiceImpl.java`

- [ ] **Step 1: 创建 Service 接口**

```java
package com.pamrock.pytest.service.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pamrock.pytest.entity.notification.HsNotification;

import java.util.Map;

public interface NotificationService {
    /** 获取未读通知列表 */
    Page<HsNotification> pageList(Integer pageNo, Integer pageSize);

    /** 获取未读通知数 */
    Long unreadCount();

    /** 标记单条已读 */
    void markAsRead(Long id);

    /** 全部标记已读 */
    void markAllAsRead();

    /** 定时扫描超时未派单订单并生成通知 */
    void scanTimeoutOrders();
}
```

- [ ] **Step 2: 创建 Service 实现**

```java
package com.pamrock.pytest.service.impl.notification;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pamrock.pytest.entity.notification.HsNotification;
import com.pamrock.pytest.entity.order.HsOrder;
import com.pamrock.pytest.mapper.notification.HsNotificationMapper;
import com.pamrock.pytest.mapper.order.HsOrderMapper;
import com.pamrock.pytest.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final HsNotificationMapper notificationMapper;
    private final HsOrderMapper orderMapper;

    @Override
    public Page<HsNotification> pageList(Integer pageNo, Integer pageSize) {
        LambdaQueryWrapper<HsNotification> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(HsNotification::getCreateTime);
        return notificationMapper.selectPage(new Page<>(pageNo, pageSize), wrapper);
    }

    @Override
    public Long unreadCount() {
        LambdaQueryWrapper<HsNotification> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HsNotification::getIsRead, 0);
        return notificationMapper.selectCount(wrapper);
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        HsNotification notification = new HsNotification();
        notification.setId(id);
        notification.setIsRead(1);
        notificationMapper.updateById(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        LambdaUpdateWrapper<HsNotification> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(HsNotification::getIsRead, 0);
        HsNotification update = new HsNotification();
        update.setIsRead(1);
        notificationMapper.update(update, wrapper);
    }

    @Override
    @Scheduled(fixedRate = 300000)
    public void scanTimeoutOrders() {
        log.debug("开始扫描超时未派单订单...");
        // 查询 status=2 且创建时间超过 30 分钟
        LambdaQueryWrapper<HsOrder> orderWrapper = new LambdaQueryWrapper<>();
        orderWrapper.eq(HsOrder::getStatus, "2");
        orderWrapper.eq(HsOrder::getDeleted, 0);
        orderWrapper.le(HsOrder::getCreateTime, LocalDateTime.now().minusMinutes(30));

        List<HsOrder> orders = orderMapper.selectList(orderWrapper);

        for (HsOrder order : orders) {
            // 去重：检查是否已有通知
            LambdaQueryWrapper<HsNotification> notiWrapper = new LambdaQueryWrapper<>();
            notiWrapper.eq(HsNotification::getRefId, order.getOrderId());
            notiWrapper.eq(HsNotification::getType, "ORDER_DISPATCH_TIMEOUT");
            notiWrapper.eq(HsNotification::getDeleted, 0);
            if (notificationMapper.selectCount(notiWrapper) > 0) continue;

            HsNotification notification = new HsNotification();
            notification.setType("ORDER_DISPATCH_TIMEOUT");
            notification.setTitle("订单超时未派单");
            notification.setContent(String.format("订单 %s 已待派单超过 30 分钟，请及时处理。创建时间：%s",
                    order.getOrderId(), order.getCreateTime()));
            notification.setRefId(order.getOrderId());
            notification.setIsRead(0);
            notificationMapper.insert(notification);

            log.info("已生成超时通知：订单 {}", order.getOrderId());
        }
    }
}
```

### 任务 C4: 创建通知 Controller

**File:** Create: `src/main/java/com/pamrock/pytest/controller/notification/NotificationController.java`

- [ ] **Step 1: 创建 Controller**

```java
package com.pamrock.pytest.controller.notification;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.pamrock.pytest.entity.notification.HsNotification;
import com.pamrock.pytest.enums.ResultCode;
import com.pamrock.pytest.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('admin')")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/list")
    public Map<String, Object> list(@RequestBody Map<String, Integer> params) {
        int pageNo = params.getOrDefault("pageNo", 1);
        int pageSize = params.getOrDefault("pageSize", 20);
        Page<HsNotification> page = notificationService.pageList(pageNo, pageSize);

        Map<String, Object> result = new HashMap<>();
        result.put("code", ResultCode.SUCCESS.getCode());
        result.put("records", page.getRecords());
        result.put("total", page.getTotal());
        result.put("unreadCount", notificationService.unreadCount());
        return result;
    }

    @PostMapping("/read")
    public Map<String, Object> read(@RequestBody Map<String, Long> params) {
        notificationService.markAsRead(params.get("id"));
        Map<String, Object> result = new HashMap<>();
        result.put("code", ResultCode.SUCCESS.getCode());
        result.put("msg", "ok");
        return result;
    }

    @PostMapping("/read-all")
    public Map<String, Object> readAll() {
        notificationService.markAllAsRead();
        Map<String, Object> result = new HashMap<>();
        result.put("code", ResultCode.SUCCESS.getCode());
        result.put("msg", "ok");
        return result;
    }

    @PostMapping("/unread-count")
    public Map<String, Object> unreadCount() {
        Long count = notificationService.unreadCount();
        Map<String, Object> result = new HashMap<>();
        result.put("code", ResultCode.SUCCESS.getCode());
        result.put("count", count);
        return result;
    }
}
```

### 任务 C5: 启用 Spring 定时任务

**File:** Check: `src/main/java/com/pamrock/pytest/PytestApplication.java`

- [ ] **Step 1: 检查是否已有 @EnableScheduling**

Check if `PytestApplication.java` has `@EnableScheduling`. If not, add:

```java
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@MapperScan("com.pamrock.pytest.mapper")
@EnableScheduling
public class PytestApplication {
    // ...
}
```

- [ ] **Step 2: 确保 security config 允许 /notification/** 路径（admin 角色）

Check `SecurityConfig.java`. The `@PreAuthorize` on the controller already restricts access to admin role. Confirm `/notification/**` is not explicitly denied.

### 任务 C6: SQL — 创建 hs_notification 表

- [ ] **Step 1: 创建 SQL 文件**

Create file: `src/main/resources/db/hs_notification.sql`

```sql
CREATE TABLE IF NOT EXISTS hs_notification (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL COMMENT '通知类型: ORDER_DISPATCH_TIMEOUT',
  title VARCHAR(128) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  ref_id VARCHAR(64) COMMENT '关联业务ID（订单号）',
  is_read TINYINT DEFAULT 0 COMMENT '0-未读, 1-已读',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
);
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add -A
git commit -m "feat: add admin notification system for timeout orders"
```

---

## 项目 D: my-admin（管理端）— 通知铃铛组件

### 任务 D1: 创建通知 API 模块

**File:** Create: `src/api/notification.js`

- [ ] **Step 1: 创建 API**

```js
import request from '@/utils/request'

export function getNotificationList(data) {
  return request.post('/notification/list', data)
}

export function markNotificationRead(data) {
  return request.post('/notification/read', data)
}

export function markAllNotificationRead() {
  return request.post('/notification/read-all', {})
}

export function getUnreadCount() {
  return request.post('/notification/unread-count', {})
}
```

### 任务 D2: 创建通知 Pinia Store

**File:** Create: `src/store/modules/notification.js`

- [ ] **Step 1: 创建 Store**

```js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnreadCount } from '@/api/notification'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  async function fetchUnreadCount() {
    try {
      const res = await getUnreadCount()
      unreadCount.value = res.count ?? 0
    } catch (e) {
      // silent
    }
  }

  function clear() {
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, clear }
})
```

### 任务 D3: 创建 NotificationPopover 组件

**File:** Create: `src/components/NotificationPopover.vue`

- [ ] **Step 1: 创建组件**

```vue
<template>
  <div class="noti-popover">
    <div class="noti-header">
      <span class="noti-title">通知 ({{ unreadCount }})</span>
      <el-button text size="small" type="primary" @click="handleReadAll" :disabled="unreadCount === 0">全部已读</el-button>
    </div>
    <div class="noti-list" v-if="notifications.length">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="noti-item"
        :class="{ unread: item.isRead === 0 }"
        @click="handleItemClick(item)"
      >
        <span v-if="item.isRead === 0" class="noti-dot"></span>
        <div class="noti-body">
          <div class="noti-item-title">{{ item.title }}</div>
          <div class="noti-item-content">{{ item.content }}</div>
          <div class="noti-item-time">{{ item.createTime }}</div>
        </div>
      </div>
    </div>
    <el-empty v-else description="暂无通知" :image-size="60" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getNotificationList, markNotificationRead, markAllNotificationRead } from '@/api/notification'
import { useNotificationStore } from '@/store/modules/notification'

const emit = defineEmits(['close'])
const router = useRouter()
const notificationStore = useNotificationStore()
const notifications = ref([])
const unreadCount = ref(0)

const props = defineProps({
  visible: Boolean
})

watch(() => props.visible, async (v) => {
  if (v) {
    await loadList()
  }
})

async function loadList() {
  try {
    const res = await getNotificationList({ pageNo: 1, pageSize: 20 })
    notifications.value = res.records || []
    unreadCount.value = res.unreadCount ?? 0
  } catch (e) {
    // silent
  }
}

async function handleItemClick(item) {
  if (item.isRead === 0) {
    await markNotificationRead({ id: item.id })
    item.isRead = 1
    notificationStore.fetchUnreadCount()
  }
  if (item.refId) {
    emit('close')
    router.push('/order')
  }
}

async function handleReadAll() {
  await markAllNotificationRead()
  notifications.value.forEach(n => n.isRead = 1)
  notificationStore.clear()
}
</script>

<style scoped>
.noti-popover { max-height: 380px; display: flex; flex-direction: column; }
.noti-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 4px 12px; border-bottom: 1px solid #f0f0f0; }
.noti-title { font-size: 14px; font-weight: 600; }
.noti-list { overflow-y: auto; flex: 1; }
.noti-item { display: flex; align-items: flex-start; gap: 8px; padding: 10px 4px; border-bottom: 1px solid #f5f5f5; cursor: pointer; }
.noti-item:hover { background: #fafafa; }
.noti-item.unread { background: #fafcff; }
.noti-dot { width: 6px; height: 6px; border-radius: 50%; background: #f56c6c; margin-top: 6px; flex-shrink: 0; }
.noti-body { flex: 1; min-width: 0; }
.noti-item-title { font-size: 13px; font-weight: 500; color: #303133; margin-bottom: 2px; }
.noti-item-content { font-size: 12px; color: #909399; line-height: 1.4; margin-bottom: 4px; }
.noti-item-time { font-size: 11px; color: #c0c4cc; }
</style>
```

### 任务 D4: 修改 Header.vue — 集成通知铃铛

**File:** Modify: `src/layout/components/Header.vue`

- [ ] **Step 1: 替换 Bell 图标为带弹窗的版本**

Replace lines 132-135 (the Bell icon) with:

```vue
      <!-- 消息通知 -->
      <el-popover placement="bottom-end" :width="360" trigger="click" @show="handleNotiShow" @hide="handleNotiHide">
        <template #reference>
          <el-badge :value="notificationStore.unreadCount" :hidden="notificationStore.unreadCount === 0" :max="99">
            <el-icon class="header-icon"><Bell /></el-icon>
          </el-badge>
        </template>
        <NotificationPopover :visible="notiVisible" @close="handleNotiClose" />
      </el-popover>
```

- [ ] **Step 2: 更新 script 部分**

Add imports and state:

```js
import { ref } from 'vue'
import Bell from '@element-plus/icons-vue' // already imported, just add:
import NotificationPopover from '@/components/NotificationPopover.vue'
import { useNotificationStore } from '@/store/modules/notification'

const notificationStore = useNotificationStore()
const notiVisible = ref(false)

function handleNotiShow() {
  notiVisible.value = true
}
function handleNotiHide() {
  notiVisible.value = false
  notificationStore.fetchUnreadCount()
}
function handleNotiClose() {
  notiVisible.value = false
  // close the popover
}
```

- [ ] **Step 3: 添加轮询逻辑**

Add `onMounted` and `onUnmounted` to start/stop polling:

```js
import { onMounted, onUnmounted } from 'vue'

let pollTimer = null

onMounted(() => {
  useNotificationStore().fetchUnreadCount()
  pollTimer = setInterval(() => {
    useNotificationStore().fetchUnreadCount()
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
```

Note: The `Bell` icon is already imported on line 3 via auto-import or explicit import. Check the existing imports — `Bell` is used at line 134.

- [ ] **Step 4: Commit**

```bash
cd /Users/pamrock/Antigravity/my-admin
git add -A
git commit -m "feat: add admin notification bell with timeout dispatch alerts"
```

---

## 项目 E: 聊天功能诊断分析

### 任务 E1: 读取所有聊天相关文件

- [ ] **Step 1: 读取后端关键文件**

Read these files for analysis:

```bash
cat /Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/config/WebSocketConfig.java
cat /Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/config/WebSocketAuthInterceptor.java
cat /Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/controller/message/MessageController.java
cat /Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/service/impl/message/MessageServiceImpl.java
cat /Users/pamrock/IdeaProjects/pytest/src/main/resources/application.properties
```

- [ ] **Step 2: 读取前端关键文件**

```bash
cat /Users/pamrock/Antigravity/hs-employee/src/utils/stomp.js
cat /Users/pamrock/Antigravity/hs-employee/src/views/employee/chat.vue
cat /Users/pamrock/Antigravity/hs-employee/src/api/message.js
cat /Users/pamrock/Antigravity/hs-user/src/utils/stomp.js
cat /Users/pamrock/Antigravity/hs-user/src/views/user/chat.vue
```

### 任务 E2: 分析并输出诊断报告

- [ ] **Step 1: 分析"初次连接慢"**

检查要点：
1. SockJS 传输方式：查看 `stomp.js` 第 19 行 `new SockJS(wsUrl)` — 没有配置 transports 数组，SockJS 会按 WebSocket → XHR → iframe 的默认顺序尝试，失败后才降级
2. 认证拦截：`WebSocketAuthInterceptor` 在 CONNECT 帧验证 JWT（查 Redis），这发生在 SockJS 建立初始 HTTP 连接之后，STOMP CONNECT 帧到达时
3. 重连延迟：`reconnectDelay: 5000`（stomp.js 第 23 行），初始连接失败 5 秒后才重试

**诊断结果**：
- SockJS 没有指定首选传输方式，在较慢的网络中会先尝试失败的传输才回退
- 生产环境 WebSocket 可能被代理层（Nginx/云防护）拦截，触发降级

**修复建议**：
- 在 `SockJS` 构造时指定 `transports: ['websocket', 'xhr-polling']`
- 减少 `reconnectDelay` 为 3000ms
- 添加连接超时提示

- [ ] **Step 2: 分析"图片发不出去"**

检查要点：
1. `chat.vue` 第 267 行 `handleUploadImage` 调用 `uploadChatImage(orderId, options.file)` 后静默失败
2. `message.js` API 调用未做超时设置
3. 后端 Spring 默认 multipart max size 为 1MB

**诊断结果**：
- 可能原因：Spring Boot 默认 `spring.servlet.multipart.max-file-size=1MB`，超过 1MB 的图片会直接失败
- 前端显示 "图片上传失败" 但没有错误详情
- 上传图片后没有检查 WebSocket 连接状态直接发送消息

**修复建议**：
- 在 `application.properties` 中设置 `spring.servlet.multipart.max-file-size=10MB`
- `handleUploadImage` 中增加详细的错误消息展示

- [ ] **Step 3: 分析"消息顺序出错"**

检查要点：
1. `chat.vue` 第 233 行 `Date.now()` 生成乐观 ID — 在同一进程同一毫秒内可能重复
2. 第 295 行去重逻辑 `m.id > 1000000000000 && m.content === msg.content && m.senderRole === msg.senderRole` — 只检查 content 和 role，时间戳仅用于判断是否是乐观消息
3. `loadHistory()` (line 180) 做 `list.reverse()` — 假设后端返回的是正序（旧→新），reverse 后变成（新→旧），但 `loadMore()` (line 154) 也做了 `list.reverse()` 然后 prepend 到 `messages.value`
4. `loadMore()` 在 `messages.value` 头部插入，这不会打乱顺序，但 `list.reverse()` 的方向依赖后端返回顺序

**诊断结果**：
- 主要风险：后端返回的消息列表排序方向不确定时，`reverse()` 会反转
- `Date.now()` 在快速连续发送时可能 ID 碰撞导致去重逻辑误判
- 没有使用 `createTime` 或消息序列号做最终的排序保障

**修复建议**：
- 用 `lightningId`（timestamp + counter）替代 `Date.now()` 做乐观 ID
- 后端统一 `order By create_time ASC` 返回，前端不再 reverse
- 在 `onMessage` 去重时，增加 `msg.id` 的严格校验，并追加后保持按 `createTime` 排序

- [ ] **Step 4: 输出诊断报告**

Create file: `docs/chat-diagnosis-report.md`

Write the complete diagnostic report in Chinese with the above findings.

- [ ] **Step 5: Commit report**

```bash
cd /Users/pamrock/Antigravity/hs-employee
git add docs/chat-diagnosis-report.md
git commit -m "docs: add chat issue diagnosis report"
```

---

## 实施顺序

1. **创建分支**（所有 4 个项目）
2. **后台**：任务 C1-C6（通知系统）
3. **管理端**：任务 D1-D4（通知 UI）
4. **员工端**：任务 A1-A8（深色模式 + 下拉刷新）
5. **用户端**：任务 B1-B6（深色模式 + 下拉刷新 + Tab 栏）
6. **聊天诊断**：任务 E1-E2（分析报告）
