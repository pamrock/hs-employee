# 家政服务系统 — 多需求设计文档

日期: 2026-05-24

## 涉及项目

| 项目 | 路径 | 类型 |
|------|------|------|
| hs-employee | `/Users/pamrock/Antigravity/hs-employee` | Vue 3 前端（员工端） |
| hs-user | `/Users/pamrock/Antigravity/hs-user` | Vue 3 前端（用户端） |
| pytest | `/Users/pamrock/IdeaProjects/pytest` | Spring Boot 后端 |
| my-admin | `/Users/pamrock/Antigravity/my-admin` | Vue 3 前端（管理端） |

## 需求概览

| # | 需求 | 涉及项目 | 方式 |
|---|------|----------|------|
| 1 | 订单页下拉刷新 + 无限滚动 | hs-employee, hs-user | 代码实现 |
| 2 | 分类 Tab 栏滑动指示器 + 毛玻璃吸顶 | hs-user | 代码实现 |
| 3 | 管理端超时未派单通知 | pytest, my-admin | 代码实现 |
| 4 | 员工端/用户端深色模式 | hs-employee, hs-user | 代码实现 |
| 5 | 聊天功能诊断分析 | pytest, 三个前端 | 先分析，输出报告 |

---

## 1. 下拉刷新 + 无限滚动

### 目标

将订单列表页（员工端 `orders.vue`、用户端 `orders.vue`）中现有的 `el-pagination` 分页替换为：
- **下拉刷新**：手指在列表顶部下拉超过阈值（60px）触发刷新，含视觉反馈
- **无限滚动**：滚动到底部自动加载下一页，无需手动点击分页按钮

### 涉及文件

- `hs-employee/src/views/employee/orders.vue`
- `hs-user/src/views/user/orders.vue`
- `hs-employee/src/assets/base.css`（移除 overscroll-behavior 限制）
- `hs-user/src/assets/base.css`（同上）
- 新建: `hs-employee/src/composables/usePullRefresh.js`
- 新建: `hs-user/src/composables/usePullRefresh.js`
- 新建: `hs-employee/src/composables/useInfiniteScroll.js`
- 新建: `hs-user/src/composables/useInfiniteScroll.js`

### 实现方案

#### usePullRefresh composable

```js
// 核心逻辑
// 1. touchstart: 记录 startY
// 2. touchmove: 计算 deltaY，当 deltaY > 0 且 scrollTop === 0 时显示下拉指示器
// 3. touchend: 当 deltaY > 60px 时触发 refresh 回调
// 4. refresh 完成后隐藏指示器
// 5. 指示器包含：旋转图标、文字提示（"下拉刷新" / "释放刷新" / "刷新中..."）
```

关键参数：
- 触发阈值: 60px
- 最大下拉距离: 100px（防止过度下拉）
- 刷新完成后自动回弹

#### useInfiniteScroll composable

```js
// 核心逻辑
// 1. 在列表底部插入一个"哨兵"元素（1px 高的 div）
// 2. 通过 IntersectionObserver 监听哨兵是否进入视口
// 3. 哨兵进入视口且有更多数据时，调用 loadMore 回调
// 4. 加载完成后重新观察
```

关键参数：
- 每次加载页数: pageSize（保持当前设置）
- rootMargin: "100px"（提前 100px 触发，提前加载）
- 当 `!hasMore` 或 `loading` 时停止触发

#### orders.vue 改动

1. 移除 `<el-pagination>` 及相关状态
2. 将 `pageNum`/`pageSize` 改为 `pageNo`/`hasMore` 模式
3. `fetchList` 改为追加模式（`orders.value.push(...newRecords)`，重置刷新时先清空 `orders.value = []`）而非替换模式
4. 引入 `usePullRefresh` 和 `useInfiniteScroll` composable
5. 模板中添加哨兵元素和下拉指示器模板

#### base.css 改动

```css
/* 移除全局的 overscroll-behavior: none */
/* 改为在 #app 级别设置，订单列表页内通过容器 CSS 控制 */
html, body {
  /* overscroll-behavior: none;  -- 删除这行 */
}
```

### 测试要点
- 下拉超过阈值应触发刷新
- 下拉不足阈值应回弹
- 滚动到底部应自动加载
- 无更多数据时不触发加载
- 加载中不应重复触发

---

## 2. 分类 Tab 栏 — 滑动指示器 + 毛玻璃吸顶

### 目标

用户端服务项目页（`services.vue`）的分类 Tab 栏改造：
- **滑动指示器**：当前选中 Tab 下方有一条下划线，宽度基于文字实际宽度
- **动画过渡**：切换 Tab 时，指示器平滑滑动到目标位置
- **毛玻璃吸顶**：Tab 栏滚动时固定在顶部，背景半透明 + 模糊效果
- **横向滚动**：Tab 可横向滚动，指示器跟随正确

### 涉及文件

- `hs-user/src/views/user/services.vue` — 主要改动的模板和样式

### 实现方案

#### 指示器位置计算

```js
// 在 activeTab 变化时更新指示器位置
function updateIndicator() {
  const activeEl = activeTabRef.value // 当前选中的 tab DOM 元素
  const containerEl = tabsContainerRef.value // tab 容器 DOM 元素
  if (!activeEl || !containerEl) return

  const { offsetLeft, offsetWidth } = activeEl
  indicatorStyle.value = {
    left: `${offsetLeft}px`,
    width: `${offsetWidth}px`
  }
}
// 每个 tab 需绑定 ref（用函数 ref 或 $el）
```

#### CSS

```css
.tabs-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  white-space: nowrap;
}

.tabs-container {
  display: inline-flex;
  gap: 24px;
  padding: 12px 14px;
  position: relative;
}

.tab-item {
  display: inline-block;
  padding: 8px 0;
  font-size: 14px;
  color: var(--app-text-muted);
  cursor: pointer;
  transition: color 0.2s;
  white-space: nowrap;
}

.tab-item.active {
  color: var(--app-primary);
  font-weight: 600;
}

.indicator {
  position: absolute;
  bottom: 12px;
  height: 3px;
  border-radius: 1.5px;
  background: var(--app-primary);
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### 现有样式改动

将现有的 `.tab-chip` 样式替换为上述 Text Tab + 指示器方案。保留"点击切换分类"的功能逻辑不变。

### 测试要点
- 点击不同 Tab 时指示器平滑滑动，宽度匹配文字
- 横向滚动后，指示器位置仍然正确
- 吸顶效果正常，滚动时看不到下面的内容穿透
- 毛玻璃效果在不同浏览器中生效（Safari 需 -webkit 前缀）

---

## 3. 管理端 — 超时未派单通知

### 目标

当订单处于"待派单"状态（status=2）超过 30 分钟时，在管理端顶部通过铃铛图标提示管理员。

### 涉及文件

#### 后端（pytest）
- 新建: `entity/notification/HsNotification.java` — 通知实体
- 新建: `mapper/notification/HsNotificationMapper.java` — MyBatis Mapper
- 新建: `service/notification/NotificationService.java` — 接口
- 新建: `service/impl/notification/NotificationServiceImpl.java` — 实现
- 新建: `controller/notification/NotificationController.java` — API 控制器
- 资源: 新建 `mapper/notification/HsNotificationMapper.xml` 或使用注解

#### 前端（my-admin）
- `src/layout/components/Header.vue` — Bell 图标功能化
- 新建: `src/api/notification.js` — 通知 API 模块
- 新建: `src/store/modules/notification.js` — Pinia 通知状态
- 新建: `src/components/NotificationPopover.vue` — 通知下拉列表组件

### 数据模型

```sql
-- hs_notification 表
CREATE TABLE hs_notification (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(32) NOT NULL COMMENT '通知类型: ORDER_DISPATCH_TIMEOUT',
  title VARCHAR(128) NOT NULL COMMENT '通知标题',
  content TEXT COMMENT '通知内容',
  ref_id VARCHAR(64) COMMENT '关联业务ID（订单号）',
  is_read TINYINT DEFAULT 0 COMMENT '0-未读, 1-已读',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted TINYINT DEFAULT 0
);
```

### 后端实现

#### 定时任务

在 `NotificationServiceImpl` 中使用 `@Scheduled(fixedRate = 300000)` 每 5 分钟扫描：

```sql
-- 扫描逻辑
SELECT * FROM hs_order
WHERE status = 2
  AND deleted = 0
  AND TIMESTAMPDIFF(MINUTE, create_time, NOW()) >= 30
  AND order_id NOT IN (
    SELECT ref_id FROM hs_notification
    WHERE type = 'ORDER_DISPATCH_TIMEOUT' AND deleted = 0
  )
```

去重：已生成过通知的订单不重复生成。

#### API 端点

```
POST /notification/list
  Request: { pageNo: 1, pageSize: 20 }
  Response: { records: [...], total, unreadCount }

POST /notification/read
  Request: { id: 123 }  // 单条已读

POST /notification/read-all
  Request: {}  // 全部已读

POST /notification/unread-count
  Request: {}
  Response: { count: 3 }
```

仅 admin 角色可访问，使用 `@PreAuthorize` 控制。

### 前端实现

#### Header.vue 改动

将现有的 Bell 图标（第 133 行）改为：

```vue
<el-popover placement="bottom-end" :width="360" trigger="click">
  <NotificationPopover />
  <template #reference>
    <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
      <el-icon class="header-icon"><Bell /></el-icon>
    </el-badge>
  </template>
</el-popover>
```

#### 通知轮询

在 `Header.vue` 的 `onMounted` 中启动 `setInterval`（30 秒间隔）调用 `/notification/unread-count` 更新角标数。

#### NotificationPopover 组件

- 顶栏：标题"通知" + "全部已读"按钮
- 列表：每条通知显示类型图标、标题、关联订单号、时间
- 未读的显示红点标记，已读的灰色
- 点击通知跳转到订单管理页对应订单
- 点击"全部已读"调用 `/notification/read-all`

### 测试要点
- 订单创建 30 分钟后应在管理端看到通知
- 已派出订单不产生通知
- 同一条订单不重复通知
- 已读后角标减少
- 全部已读后角标消失

---

## 4. 深色模式

### 目标

为员工端和用户端添加深色模式支持：
- 默认跟随系统 `prefers-color-scheme`
- 提供手动切换开关（覆盖系统设置）
- 状态持久化到 localStorage

### 涉及文件

#### hs-employee
- `src/assets/main.css` — 新增暗色 CSS 变量
- `src/assets/base.css` — 移除无用的 Vue 模板暗色变量
- `src/views/employee/layout.vue` — 添加切换按钮
- `src/views/employee/orders.vue` — 少量硬编码颜色适配
- `src/views/employee/chat.vue` — 气泡颜色适配
- `src/views/employee/login.vue` — 背景适配
- `src/views/employee/register.vue` — 背景适配
- 新建: `src/composables/useDarkMode.js`

#### hs-user
- `src/assets/main.css` — 同上
- `src/assets/base.css` — 同上
- `src/views/user/layout.vue` — 添加切换按钮
- `src/views/user/services.vue` — 硬编码颜色适配
- `src/views/user/orders.vue` — 硬编码颜色适配
- `src/views/user/chat.vue` — 气泡颜色适配
- `src/views/user/login.vue` — 背景适配
- `src/views/user/register.vue` — 背景适配
- 新建: `src/composables/useDarkMode.js`

### 暗色调色板

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

### useDarkMode composable

```js
// 核心逻辑
export function useDarkMode() {
  const isDark = ref(false)

  // 读取优先级: localStorage > 系统偏好 > 默认浅色
  function getPreferredTheme() {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme)
    isDark.value = theme === 'dark'
  }

  function toggle() {
    const newTheme = isDark.value ? 'light' : 'dark'
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // 监听系统变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light')
    }
  })

  // 初始化
  applyTheme(getPreferredTheme())

  return { isDark, toggle }
}
```

### Element Plus 暗色变量

在 `main.js` 中添加：
```js
import 'element-plus/theme-chalk/dark/css-vars.css'
```

两个项目都需要同样的处理。

### 组件硬编码颜色适配

以下硬编码颜色需要改为 CSS 变量引用：

| 位置 | 原值 | 改为 |
|------|------|------|
| chat.vue 容器背景 | `#f0f0f0` | `var(--app-bg)` |
| chat.vue 白气泡 | `#ffffff` | `var(--app-bg-white)` |
| services.vue 渐变背景 | `#eef4ff, #e8f9ff` | CSS 变量 |
| orders.vue 状态标签 | `#f56c6c` | `var(--app-danger)` |
| login.vue 绿色渐变 | 硬编码 | 暗色模式下调暗 |

### 切换按钮位置

- 放在 `layout.vue` 底部 Tab 栏右侧
- 使用 Element Plus 的 `<el-switch>` + 月亮/太阳图标
- 切换时调用 `toggle()`

### 测试要点
- 系统深色模式下自动变为暗色
- 手动切换到浅色后覆盖系统偏好
- 持久化：刷新页面后保持上次选择
- Element Plus 组件颜色正常跟随
- 所有页面（订单、服务、聊天、登录、注册、个人中心）无白场

---

## 5. 聊天功能诊断分析

### 目标

先对聊天功能的三个已知问题做深入分析，输出诊断报告，再由用户决定修复方案。

### 涉及文件

#### 后端
- `config/WebSocketConfig.java` — WebSocket 端点、STOMP broker 配置
- `config/WebSocketAuthInterceptor.java` — 连接认证
- `controller/message/MessageController.java` — REST + STOMP 端点
- `service/impl/message/MessageServiceImpl.java` — 消息持久化

#### 前端（hs-employee、hs-user）
- `utils/stomp.js` — STOMP 客户端封装
- `views/user/chat.vue` / `views/employee/chat.vue` — 聊天页面
- `api/message.js` — 消息 API

### 分析要点

#### 1. 初次连接慢

可能原因：
- SockJS 先尝试 WebSocket 建立失败后才降级到 XHR polling，造成延迟
- Spring Security 对 `/ws/**` 虽然放行，但认证拦截器在 CONNECT 帧时验证 JWT（查 Redis），Redis 响应慢
- `reconnectDelay: 5000` 初始连接失败后等 5 秒才重试
- 网络环境差时 SockJS 可能会选择较慢的传输方式

需要检查：
- SockJS 实际使用的传输方式（在浏览器 DevTools Network 中查看）
- `/ws/info` 端点响应时间
- Redis 连接是否正常

#### 2. 图片发不出去

可能原因：
- `handleBeforeUpload` 中有 10MB 限制，但前端 `FormData` 传输未经压缩，可能超过 nginx 反向代理 body size 限制
- 后端 `upload-image` 接口未限制文件大小（Spring 默认 1MB multipart）
- OSS 上传失败时静默吞错，前端无反馈
- 图片上传成功后，WebSocket 发送消息时连接已断开

需要检查：
- Spring multipart max size 配置
- Nginx/Pod body size 限制
- 后端 upload-image 的异常处理和返回码

#### 3. 消息顺序出错

可能原因：
- 乐观更新使用 `Date.now()` 生成临时 ID，在同一毫秒内多消息可能 ID 碰撞
- 去重逻辑只检查 content 和 senderRole 的匹配，不检查时间戳
- 消息历史加载时 `reverse()` 操作可能把服务端顺序搞反
- WebSocket 消息到达顺序和发送顺序不一致（TCP 层面通常有序，但重连后可能乱）
- `loadMore()` 翻页加载历史消息后插入到 `messages` 数组头部，可能打乱顺序

需要检查：
- `loadMore` 翻页逻辑中 prepend 操作是否正确
- 去重逻辑是否足够健壮
- 消息列表的最终排序保证

### 输出格式

诊断报告格式：
```
## 聊天功能诊断报告

### 问题 1: 初次连接慢
- 根因: [具体原因]
- 证据: [代码位置 + 可能的数据]
- 修复建议: [方案]

### 问题 2: 图片发不出去
- 根因: [具体原因]
- ...

### 问题 3: 消息顺序出错
- 根因: [具体原因]
- ...
```

---

## 实现注意事项

### Git 分支策略

每个项目在修改前创建新分支：

```bash
# hs-employee
cd /Users/pamrock/Antigravity/hs-employee && git checkout -b feature/multi-upgrade

# hs-user
cd /Users/pamrock/Antigravity/hs-user && git checkout -b feature/multi-upgrade

# pytest
cd /Users/pamrock/IdeaProjects/pytest && git checkout -b feature/notification

# my-admin
cd /Users/pamrock/Antigravity/my-admin && git checkout -b feature/notification
```

### 通用原则

- 遵循现有项目的代码风格（`<script setup>` + Element Plus + scoped CSS）
- 不引入新的第三方依赖（除非必要）
- 与现有 API 交互方式保持一致
- 移动端优先，关注触摸交互和 safe-area

### 风险和降级

- 下拉刷新在 iOS Safari 上可能与系统"橡皮筋"效果冲突——需在容器上处理
- 毛玻璃效果 `backdrop-filter` 在部分旧版安卓浏览器不支持——降级为不透明背景
- 深色模式下 Element Plus 某些组件可能不完全适配——逐一验证
- 通知定时任务频率不宜过高，避免数据库压力
