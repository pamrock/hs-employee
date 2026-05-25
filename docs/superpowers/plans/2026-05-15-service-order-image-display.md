# 服务项目和订单图片展示 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在用户端和员工端的服务列表、订单卡片上展示服务项目的真实图片（替换当前 Picture 占位图标）

**Architecture:** 后端在订单查询后批量获取关联服务项目的 OSS 预签名URL，通过 DTO 返回给前端。前端用 `<img>` 标签替换占位图标，无图片时回退到图标。

**Tech Stack:** Spring Boot 3.5.8 / MyBatis Plus / Aliyun OSS / Vue 3 / Element Plus

---

## 前置准备：创建分支

在开始实现前，为每个工程创建功能分支。

> **注意：** 以下 step 需在实际执行时各自创建分支，不要在 plan review 阶段执行。

### pytest 后端

- [ ] 确认在 pytest 工程目录下，创建分支：
```bash
cd /Users/pamrock/IdeaProjects/pytest
git checkout -b feature/service-order-images
```

### hs-user 用户端

- [ ] 确认在 hs-user 工程目录下，创建分支：
```bash
cd /Users/pamrock/Antigravity/hs-user
git checkout -b feature/service-order-images
```

### hs-employee 员工端

- [ ] 确认在 hs-employee 工程目录下，创建分支：
```bash
cd /Users/pamrock/Antigravity/hs-employee
git checkout -b feature/service-order-images
```

---

### Task 1: Backend — 修改 OrderMyListResp DTO

**Files:**
- Modify: `src/main/java/com/pamrock/pytest/dto/response/order/OrderMyListResp.java`

- [ ] **Step 1: 添加 serviceItemImageUrl 字段**

在该文件最后一个字段 `orderId` 之后、类结束 `}` 之前添加：

```java
    @Schema(description = "服务项目图片URL")
    private String serviceItemImageUrl;
```

完整的新增位置（在 `orderId` 字段之后）：

```java
    @Schema(description = "订单 id")
    private String orderId;

    @Schema(description = "服务项目图片URL")
    private String serviceItemImageUrl;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add src/main/java/com/pamrock/pytest/dto/response/order/OrderMyListResp.java
git commit -m "feat: OrderMyListResp 新增 serviceItemImageUrl 字段"
```

---

### Task 2: Backend — 修改 OrderResp DTO

**Files:**
- Modify: `src/main/java/com/pamrock/pytest/dto/response/order/OrderResp.java`

- [ ] **Step 1: 添加 serviceItemImageUrl 字段**

在该文件最后一个字段 `updatedBy` 之后、类结束 `}` 之前添加：

```java
    @Schema(description = "更新人")
    private String updatedBy;

    @Schema(description = "服务项目图片URL")
    private String serviceItemImageUrl;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add src/main/java/com/pamrock/pytest/dto/response/order/OrderResp.java
git commit -m "feat: OrderResp 新增 serviceItemImageUrl 字段"
```

---

### Task 3: Backend — 修改 OrderDetailInfoResp DTO

**Files:**
- Modify: `src/main/java/com/pamrock/pytest/dto/response/order/OrderDetailInfoResp.java`

- [ ] **Step 1: 添加 serviceItemImageUrl 字段**

在该文件最后一个字段 `ratingComment` 之后、类结束 `}` 之前添加：

```java
    @Schema(description = "评价内容")
    private String ratingComment;

    @Schema(description = "服务项目图片URL")
    private String serviceItemImageUrl;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add src/main/java/com/pamrock/pytest/dto/response/order/OrderDetailInfoResp.java
git commit -m "feat: OrderDetailInfoResp 新增 serviceItemImageUrl 字段"
```

---

### Task 4: Backend — 注入 OssService 并在订单查询后填充图片URL

**Files:**
- Modify: `src/main/java/com/pamrock/pytest/service/impl/order/OrderServiceImpl.java`

- [ ] **Step 1: 添加 OssService import**

在已有 import 区域，添加：

```java
import com.pamrock.pytest.service.oss.OssService;
```

- [ ] **Step 2: 添加 OssService 依赖注入**

在类的 final 字段声明区域，在最后一个 final 字段 `HsServiceItemMapper hsServiceItemMapper` 之后添加：

```java
    private final OssService ossService;
```

> 注意：该类使用 `@RequiredArgsConstructor`，Lombok 会自动生成构造函数注入，无需手动写 `@Autowired`。

- [ ] **Step 3: 添加私有辅助方法 `enrichServiceItemImages`**

在类的末尾，`getWeekDayChinese` 方法之后、类结束 `}` 之前，添加：

```java
    /**
     * 为订单响应列表批量填充服务项目图片URL
     */
    private void enrichServiceItemImages(List<?> orderResults) {
        if (CollectionUtils.isEmpty(orderResults)) {
            return;
        }

        // 收集所有 serviceItemId
        Set<Integer> serviceItemIds = new HashSet<>();
        for (Object result : orderResults) {
            Integer itemId = null;
            if (result instanceof OrderResp) {
                itemId = ((OrderResp) result).getServiceItemId();
            } else if (result instanceof OrderMyListResp) {
                // OrderMyListResp 没有 serviceItemId 字段，需要从 order 直接关联
                // 但该 DTO 只有 serviceItem 字符串，无法反向查图片
                // 因此 OrderMyListResp 的图片需要另一种方式处理，见下方 enrichMyOrderImages 方法
                return;
            }
            if (itemId != null) {
                serviceItemIds.add(itemId);
            }
        }
        if (serviceItemIds.isEmpty()) {
            return;
        }

        // 批量查询服务项目
        List<HsServiceItem> items = hsServiceItemMapper.selectBatchIds(serviceItemIds);
        Map<Integer, String> imageUrlMap = new HashMap<>();
        for (HsServiceItem item : items) {
            if (item.getImageUrl() != null && !item.getImageUrl().isBlank()) {
                try {
                    imageUrlMap.put(item.getId().intValue(), ossService.getPresignedUrl(item.getImageUrl()));
                } catch (Exception e) {
                    log.warn("获取服务项目 {} 的图片URL失败: {}", item.getId(), e.getMessage());
                }
            }
        }

        // 回填到 DTO
        for (Object result : orderResults) {
            if (result instanceof OrderResp) {
                Integer itemId = ((OrderResp) result).getServiceItemId();
                if (itemId != null) {
                    ((OrderResp) result).setServiceItemImageUrl(imageUrlMap.get(itemId));
                }
            }
        }
    }
```

- [ ] **Step 4: 为有 `serviceItemId` 的 DTO 添加图片 enrichment method**

在 `enrichServiceItemImages` 方法之后、类结束 `}` 之前，添加针对 `OrderMyListResp` 和 `OrderDetailInfoResp` 的方法：

```java
    /**
     * 为单个订单响应填充服务项目图片URL（通过serviceItemId）
     */
    private void enrichSingleOrderImage(Object result, Integer serviceItemId) {
        if (serviceItemId == null) return;
        HsServiceItem item = hsServiceItemMapper.selectById(serviceItemId);
        if (item != null && item.getImageUrl() != null && !item.getImageUrl().isBlank()) {
            try {
                String url = ossService.getPresignedUrl(item.getImageUrl());
                if (result instanceof OrderMyListResp) {
                    ((OrderMyListResp) result).setServiceItemImageUrl(url);
                } else if (result instanceof OrderDetailInfoResp) {
                    ((OrderDetailInfoResp) result).setServiceItemImageUrl(url);
                }
            } catch (Exception e) {
                log.warn("获取服务项目 {} 的图片URL失败: {}", serviceItemId, e.getMessage());
            }
        }
    }
```

- [ ] **Step 5: 在 `listOrders()` 方法末尾（return 之前）调用 enrichment**

在 `listOrders()` 方法中，`return ResultMsg.ok(pageResp);` 之前，添加：

```java
        enrichServiceItemImages(list);
```

完整上下文：
```java
        List<OrderResp> list = resultPage.getRecords();
        enrichServiceItemImages(list);

        PageResp<OrderResp> pageResp = new PageResp<>();
```

- [ ] **Step 6: 在 `listMyOrders()` 方法中添加 enrichment**

问题：`OrderMyListResp` 没有 `serviceItemId` 字段。需要检查 `OrderMyListReq` 和 mapper 查询逻辑，看能否在返回中拿到 `serviceItemId`。

需要额外修改：给 `OrderMyListResp` 添加 `serviceItemId` 字段：

在 `OrderMyListResp.java` 中 `serviceItem` 字段之后添加：

```java
    @Schema(description = "服务项目ID")
    private Integer serviceItemId;

    @Schema(description = "服务项目")
    private String serviceItem;
```

同时在 mapper XML 中确保查询返回 `service_item_id`。

然后在 `listMyOrders()` 方法中，`return ResultMsg.ok(pageResp);` 之前，遍历结果并调用 enrichment：

```java
        for (OrderMyListResp resp : list) {
            enrichSingleOrderImage(resp, resp.getServiceItemId());
        }
```

- [ ] **Step 7: 在 `getOrderDetail()` 方法中添加 enrichment**

在 `getOrderDetail()` 方法中，`return ResultMsg.ok(resp);` 之前，添加：

```java
        enrichSingleOrderImage(resp, resp.getServiceItemId());
```

- [ ] **Step 8: 在 `listEmployeeOrders()` 方法末尾调用 enrichment**

在 `listEmployeeOrders()` 方法中，`return ResultMsg.ok(pageResp);` 之前，添加：

```java
        enrichServiceItemImages(list);
```

- [ ] **Step 9: 验证编译通过**

```bash
cd /Users/pamrock/IdeaProjects/pytest
./mvnw compile
```

- [ ] **Step 10: Commit**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add src/main/java/com/pamrock/pytest/service/impl/order/OrderServiceImpl.java src/main/java/com/pamrock/pytest/dto/response/order/OrderMyListResp.java
git commit -m "feat: 订单查询后填充服务项目图片预签名URL"
```

---

### Task 5: Backend — 验证 MyBatis XML 查询包含 serviceItemId

**Files:**
- Read: `src/main/resources/mapper/` 下 order 相关 XML 文件

- [ ] **Step 1: 检查 OrderMyListResp 映射**

查找 mapper XML 中 `OrderMyListResp` 对应的 resultMap 或查询列，确认 `<result column="service_item_id" property="serviceItemId"/>` 或 SQL 中包含 `hs_order.service_item_id`。

如果缺失，添加此映射。

- [ ] **Step 2: 验证编译**

```bash
cd /Users/pamrock/IdeaProjects/pytest
./mvnw compile
```

- [ ] **Step 3: Commit（如有修改）**

```bash
cd /Users/pamrock/IdeaProjects/pytest
git add src/main/resources/mapper/
git commit -m "fix: 确保订单列表查询返回 serviceItemId"
```

---

### Task 6: User Frontend — 服务列表页显示真实图片

**Files:**
- Modify: `src/views/user/services.vue`

改动前 (lines 11-13):
```html
          <div class="card-cover">
            <el-icon :size="34" color="#91a3b0"><Picture /></el-icon>
          </div>
```

- [ ] **Step 1: 替换模板中的占位图标**

```html
          <div class="card-cover">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              class="cover-img"
              @error="e => e.target.style.display = 'none'"
            />
            <el-icon v-else :size="34" color="#91a3b0"><Picture /></el-icon>
          </div>
```

> 图片加载失败时 `@error` 隐藏 img 元素，`.card-cover` 的渐变背景作为回退展示。无 imageUrl 时显示 Picture 图标。

- [ ] **Step 2: 添加图片 CSS 样式**

在 `<style scoped>` 区域，`.card-cover` 样式之后添加：

```css
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
```

同时修改 `.card-cover` 的 `overflow: hidden`：

```css
.card-cover {
  width: 78px;
  height: 78px;
  border-radius: 10px;
  background: linear-gradient(145deg, #eef4ff, #e8f9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/pamrock/Antigravity/hs-user
git add src/views/user/services.vue
git commit -m "feat: 服务列表显示服务项目图片"
```

---

### Task 7: User Frontend — 订单列表页显示服务项目图片

**Files:**
- Modify: `src/views/user/orders.vue`

改动前 (lines 27-29):
```html
            <div class="order-img">
              <el-icon :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
```

- [ ] **Step 1: 替换模板中的占位图标**

```html
            <div class="order-img">
              <img
                v-if="order.serviceItemImageUrl"
                :src="order.serviceItemImageUrl"
                class="order-cover-img"
                @error="e => e.target.style.display = 'none'"
              />
              <el-icon v-else :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
```

- [ ] **Step 2: 添加 CSS 样式**

在 `.order-img` 样式块中添加 `overflow: hidden`，并新增图片样式：

```css
.order-img {
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.order-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/pamrock/Antigravity/hs-user
git add src/views/user/orders.vue
git commit -m "feat: 订单列表显示服务项目图片"
```

---

### Task 8: Employee Frontend — 订单列表页显示服务项目图片

**Files:**
- Modify: `src/views/employee/orders.vue`

改动前 (lines 27-29):
```html
            <div class="order-img">
              <el-icon :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
```

- [ ] **Step 1: 替换模板中的占位图标（与用户端相同逻辑）**

```html
            <div class="order-img">
              <img
                v-if="order.serviceItemImageUrl"
                :src="order.serviceItemImageUrl"
                class="order-cover-img"
                @error="e => e.target.style.display = 'none'"
              />
              <el-icon v-else :size="28" color="#c0c4cc"><Picture /></el-icon>
            </div>
```

- [ ] **Step 2: 添加 CSS 样式**

在 `.order-img` 样式块中添加 `overflow: hidden`，并新增图片样式：

```css
.order-img {
  width: 56px;
  height: 56px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.order-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/pamrock/Antigravity/hs-user  # 注意：是 hs-employee
git add src/views/employee/orders.vue
git commit -m "feat: 员工端订单列表显示服务项目图片"
```

> 修正路径：
```bash
cd /Users/pamrock/Antigravity/hs-employee
git add src/views/employee/orders.vue
git commit -m "feat: 员工端订单列表显示服务项目图片"
```

---

### Task 9: 最终验证

- [ ] **Step 1: 启动后端验证**

```bash
cd /Users/pamrock/IdeaProjects/pytest
./mvnw spring-boot:run
```

确认启动无异常。

- [ ] **Step 2: 启动前端验证（用户端）**

```bash
cd /Users/pamrock/Antigravity/hs-user
yarn dev
```

打开浏览器，访问服务列表页，确认有图片的服务项目显示真实图片，无图片的显示占位图标。访问订单列表页，同样验证。

- [ ] **Step 3: 启动前端验证（员工端）**

```bash
cd /Users/pamrock/Antigravity/hs-employee
yarn dev
```

打开浏览器，访问订单列表页，确认服务项目图片显示正常。

---

## 注意事项

1. **MyBatis XML 验证（Task 5）**: `OrderMyListResp` 当前只有 `serviceItem` 字符串字段，无 `serviceItemId`。如果在 mapper XML 的 SQL 中未查询 `hs_order.service_item_id`，则需要添加。如果无法从现有 SQL 获得 `serviceItemId`，`enrichSingleOrderImage` 方案将需要改为另一方式 — 比如在 `listMyOrders()` 中额外查询订单获取 `serviceItemId`。

2. **OSS 预签名 URL 时效**: 图片 URL 有时效限制（通常几小时），这意味着缓存的页面或长时间停留的页面图片可能会过期。如果后续发现此问题，可用 `el-image` 的 `lazy` + 定期刷新策略解决。当前 scope 不做此优化。

3. **不涉及管理端**: 本计划不修改 `my-admin` 任何文件。
