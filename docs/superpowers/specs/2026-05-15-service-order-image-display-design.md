# 服务项目和订单图片展示功能 — 设计方案

## 需求概述

为用户端（hs-user）和员工端（hs-employee）的服务列表和订单页面添加服务项目图片展示功能。目前后端已有 Aliyun OSS 图片存储能力，HsServiceItem 已有 imageUrl 字段，但前端页面仅显示 Picture 占位图标，未使用真实图片。

## 范围

- 仅展示服务项目已有的图片，不新增订单独立的图片上传
- 改动涉及三端：pytest（后端）、hs-user（用户前端）、hs-employee（员工前端）
- 不涉及 hs-my-admin 管理端

## 后端改动（pytest）

### DTO 修改

3 个响应 DTO 各新增一个字段 `serviceItemImageUrl`：

| DTO | 用于接口 |
|---|---|
| `OrderMyListResp.java` | `/order/my/list` — 用户端订单列表 |
| `OrderResp.java` | `/order/list`、`/order/employee/list` — 员工端/管理端订单列表 |
| `OrderDetailInfoResp.java` | `/order/detail` — 订单详情 |

```java
private String serviceItemImageUrl;
```

### Service 层修改

`OrderServiceImpl` 中，查询订单列表/详情时：
1. 根据订单的 `serviceItemId` 查询 `hs_service_item` 表获取 `image_url`
2. 若 `image_url` 非空，调用 `ossService.getPresignedUrl(imageUrl)` 生成临时访问 URL
3. 赋值到响应 DTO 的 `serviceItemImageUrl` 字段

### 不改动

- 不新增数据库表/字段（复用已有 HsServiceItem.imageUrl）
- 不新增 API 接口
- 不修改安全配置
- 不修改 OSS 相关服务

## 用户端改动（hs-user）

### services.vue — 服务列表页

文件：`src/views/user/services.vue`

```html
<!-- 当前（占位图标） -->
<div class="card-cover">
  <el-icon :size="34" color="#91a3b0"><Picture /></el-icon>
</div>

<!-- 改为真实图片 + 回退 -->
<div class="card-cover">
  <img v-if="item.imageUrl" :src="item.imageUrl" @error="onImgError" />
  <el-icon v-else :size="34" color="#91a3b0"><Picture /></el-icon>
</div>
```

### orders.vue — 订单列表页

文件：`src/views/user/orders.vue`

```html
<!-- 当前（占位图标） -->
<div class="order-img">
  <el-icon :size="28" color="#c0c4cc"><Picture /></el-icon>
</div>

<!-- 改为真实图片 + 回退 -->
<div class="order-img">
  <img v-if="order.serviceItemImageUrl" :src="order.serviceItemImageUrl" @error="onImgError" />
  <el-icon v-else :size="28" color="#c0c4cc"><Picture /></el-icon>
</div>
```

### 不改动

- 不新增 API 文件
- 不新增组件
- 不改变卡片布局结构

## 员工端改动（hs-employee）

### orders.vue — 订单列表页

文件：`src/views/employee/orders.vue`

同用户端订单卡片逻辑，将 `.order-img` 中的 Picture 图标替换为真实图片。

### 不改动

- 不新增 item.js API（图片通过订单接口返回）
- 不新增组件
- 不改变卡片布局结构

## 图片加载回退策略

- 当 `imageUrl` 为空或 `undefined`：显示 Picture 占位图标（与服务项目详情页首字母头像 style 类似）
- 当图片加载失败（onerror）：显示 Picture 占位图标
- 图片使用 `object-fit: cover` 填充卡片区域
- 不新增 el-image 组件依赖，使用原生 img 标签

## 文件改动清单

| 工程 | 文件 | 改动类型 |
|---|---|---|
| pytest | `dto/response/order/OrderMyListResp.java` | 新增字段 |
| pytest | `dto/response/order/OrderResp.java` | 新增字段 |
| pytest | `dto/response/order/OrderDetailInfoResp.java` | 新增字段 |
| pytest | `service/impl/order/OrderServiceImpl.java` | 修改逻辑 |
| hs-user | `src/views/user/services.vue` | 模板改动 |
| hs-user | `src/views/user/orders.vue` | 模板改动 |
| hs-employee | `src/views/employee/orders.vue` | 模板改动 |
