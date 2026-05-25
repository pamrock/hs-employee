# 图形验证码实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现后端图形验证码生成/校验，前端对接真实 captcha API 替代占位文字。

**Architecture:** 后端用 Hutool CaptchaUtil 生成验证码图片，Redis 存验证码文本（key: captcha:{uuid}，TTL 300秒），登录接口校验。前端调用 GET /auth/captcha 获取 base64 图片，登录时提交 captchaId+captchaCode。

**Tech Stack:** Spring Boot 3.5.8 + Hutool 5.8.41 + Redis (Jedis) + Vue 3 + Element Plus

---

### Task 1: 后端 — 验证码生成与校验

**Files:**
- Modify: `/Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/dto/request/auth/LoginRequest.java`
- Modify: `/Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/service/login/AuthService.java`
- Modify: `/Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/service/impl/login/AuthServiceImpl.java`
- Modify: `/Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/controller/login/AuthController.java`
- Create: `/Users/pamrock/IdeaProjects/pytest/src/main/java/com/pamrock/pytest/dto/response/CaptchaResponse.java`

- [ ] **Step 1: LoginRequest.java 添加 captchaId 和 captchaCode 字段**

Only add two private fields inside the class. Use Lombok @Data so getters/setters are auto-generated.

```java
package com.pamrock.pytest.dto.request.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;
    private String captchaId;
    private String captchaCode;
}
```

- [ ] **Step 2: 新建 CaptchaResponse.java**

```java
package com.pamrock.pytest.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CaptchaResponse {
    private String captchaId;
    private String captchaImage;
}
```

- [ ] **Step 3: AuthService.java 添加 getCaptcha 方法声明**

Add import and method:
```java
package com.pamrock.pytest.service.login;

import com.pamrock.pytest.dto.request.auth.LoginRequest;
import com.pamrock.pytest.dto.request.auth.RegisterRequest;
import com.pamrock.pytest.dto.response.CaptchaResponse;
import com.pamrock.pytest.dto.response.JwtResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthService {

    JwtResponse login(LoginRequest loginRequest, HttpServletRequest request);

    void register(RegisterRequest registerRequest);

    CaptchaResponse getCaptcha();
}
```

- [ ] **Step 4: AuthServiceImpl.java — 添加验证码校验逻辑和生成方法**

**在 `login()` 方法开头**（`String ip = getClientIp(request);` 之前）插入验证码校验：

```java
@Override
public JwtResponse login(LoginRequest loginRequest, HttpServletRequest request) {
    // 验证码校验
    String captchaId = loginRequest.getCaptchaId();
    String captchaCode = loginRequest.getCaptchaCode();
    if (!StringUtils.hasText(captchaId) || !StringUtils.hasText(captchaCode)) {
        throw new RuntimeException("验证码不能为空");
    }
    String redisKey = "captcha:" + captchaId;
    String storedCode = RedisOperateHandler.get(redisKey);
    if (storedCode == null) {
        throw new RuntimeException("验证码已过期，请刷新");
    }
    if (!storedCode.equalsIgnoreCase(captchaCode)) {
        RedisOperateHandler.delete(redisKey);
        throw new RuntimeException("验证码错误");
    }
    RedisOperateHandler.delete(redisKey);

    String ip = getClientIp(request);
    // ... rest of existing login logic unchanged
```

**在类末尾**（`register()` 方法之后）添加 `getCaptcha()` 实现：

```java
@Override
public CaptchaResponse getCaptcha() {
    cn.hutool.captcha.LineCaptcha lineCaptcha = cn.hutool.captcha.CaptchaUtil.createLineCaptcha(200, 100, 4, 20);
    String code = lineCaptcha.getCode();
    String captchaId = java.util.UUID.randomUUID().toString();
    String base64 = lineCaptcha.getImageBase64Data();
    RedisOperateHandler.set("captcha:" + captchaId, code, RedisOperateHandler.MIN_5);
    return new CaptchaResponse(captchaId, "data:image/png;base64," + base64);
}
```

- [ ] **Step 5: AuthController.java 添加 GET /auth/captcha 端点**

在 `register()` 方法后添加：

```java
@GetMapping("/captcha")
public ResultMsg<CaptchaResponse> getCaptcha() {
    CaptchaResponse response = authService.getCaptcha();
    return ResultMsg.ok(response);
}
```

需要添加的 import：
```java
import com.pamrock.pytest.dto.response.CaptchaResponse;
import org.springframework.web.bind.annotation.GetMapping;
```

- [ ] **Step 6: 编译验证**

```bash
cd /Users/pamrock/IdeaProjects/pytest && ./mvnw clean compile
```

确认编译通过，无错误。

---

### Task 2: hs-user 前端 — api/login.js + login.vue + register.vue

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-user/src/api/login.js`
- Modify: `/Users/pamrock/Antigravity/hs-user/src/views/user/login.vue`
- Modify: `/Users/pamrock/Antigravity/hs-user/src/views/user/register.vue`

- [ ] **Step 1: api/login.js 添加 getCaptcha**

```js
import request from '@/utils/request'

export function login(data) {
  return request.post('/auth/login', data)
}

export function register(data) {
  return request.post('/auth/register', data)
}

export function logout() {
  return request.post('/user/logout')
}

export function getCaptcha() {
  return request.get('/auth/captcha')
}
```

- [ ] **Step 2: login.vue — 修改 script 部分 captcha 相关逻辑**

**替换 `refreshCaptcha` 函数**（找到并替换原来的纯客户端实现）：

原来的：
```js
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
```

改为：
```js
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    if (res.data && res.data.success !== false) {
      const captchaData = res.data.data || res.data
      captchaId.value = captchaData.captchaId
      captchaUrl.value = captchaData.captchaImage
    }
  } catch (e) {
    console.error('获取验证码失败', e)
  }
}
```

**修改 import 语句**，添加 `getCaptcha`：
```js
import { login, getCaptcha } from '@/api/login'
```

**删除 `generateCaptchaPlaceholder` 和 `captchaPlaceholder`**（不再需要客户端占位）。

**修改 `handleLogin` 中的 API 调用**，添加 captchaId 和 captchaCode：

```js
const { data } = await login({
  username: loginForm.username,
  password: loginForm.password,
  captchaId: captchaId.value,
  captchaCode: loginForm.captcha
})
```

- [ ] **Step 3: login.vue — 修改 template 中 captcha-img 区域**

将：
```html
<span v-if="!captchaUrl" class="captcha-placeholder">{{ captchaPlaceholder }}</span>
<img v-else :src="captchaUrl" alt="验证码" />
```

改为（始终显示图片）：
```html
<img v-if="captchaUrl" :src="captchaUrl" alt="验证码" class="captcha-image" />
<div v-else class="captcha-loading">加载中...</div>
```

需要在 style 中添加：
```css
.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.captcha-loading {
  font-size: 12px;
  color: #999;
}
```

并删除 `.captcha-placeholder` 样式规则。

- [ ] **Step 4: register.vue — 移除验证码**

移除 template 中整个 `<div class="captcha-row">` 区域。
移除 script 中 `captchaUrl`、`captchaPlaceholder`、`registerForm.captcha`、`generateCaptchaPlaceholder`、`refreshCaptcha`、`onMounted`（如果仅用于 captcha）、`Key` icon import。
移除 `handleRegister` 中对 `registerForm.captcha` 的校验。
移除 style 中所有 captcha 相关样式（`.captcha-row`、`.captcha-input`、`.captcha-img`、`.captcha-placeholder` 等）。

---

### Task 3: hs-employee 前端 — api/login.js + login.vue + register.vue

**Files:**
- Modify: `/Users/pamrock/Antigravity/hs-employee/src/api/login.js`
- Modify: `/Users/pamrock/Antigravity/hs-employee/src/views/employee/login.vue`
- Modify: `/Users/pamrock/Antigravity/hs-employee/src/views/employee/register.vue`

改动与 Task 2 完全相同，区别仅在于：
- `login.vue` 中 `handleLogin` 的 token 存储方式为 `setEmployeeToken(token)`，保持不变
- 路由跳转为 `/employee/orders`，保持不变
- `import { login, getCaptcha } from '@/api/login'`

具体步骤同 Task 2：
- [ ] Step 1: api/login.js 添加 getCaptcha()
- [ ] Step 2: login.vue 修改 captcha 逻辑（调用真实 API）
- [ ] Step 3: login.vue template 改 captcha-img 为图片展示
- [ ] Step 4: register.vue 移除验证码

---

### Task 4: my-admin 前端 — api/login.js + login/index.vue + register/index.vue

**Files:**
- Modify: `/Users/pamrock/Antigravity/my-admin/src/api/login.js`
- Modify: `/Users/pamrock/Antigravity/my-admin/src/views/login/index.vue`
- Modify: `/Users/pamrock/Antigravity/my-admin/src/views/register/index.vue`

改动结构与 Task 2 相同，区别：
- login/index.vue 使用 Pinia store (`userStore.login(token)`)，保持 `handleLogin` 原有结构不变
- 只需修改 `refreshCaptcha`（调用 API）、template captcha-img 区域、登录请求添加 captchaId+captchaCode
- register/index.vue 移除 captcha

具体步骤同 Task 2：
- [ ] Step 1: api/login.js 添加 getCaptcha()
- [ ] Step 2: login/index.vue 修改 captcha 逻辑
- [ ] Step 3: login/index.vue template 改 captcha-img
- [ ] Step 4: register/index.vue 移除验证码

---

### 验证清单

全部完成后：
```bash
# 后端编译
cd /Users/pamrock/IdeaProjects/pytest && ./mvnw clean compile

# 各前端启动检查
cd /Users/pamrock/Antigravity/hs-user && yarn dev
cd /Users/pamrock/Antigravity/hs-employee && yarn dev
cd /Users/pamrock/Antigravity/my-admin && npm run dev
```

验证项目：
- [ ] 后端编译通过
- [ ] 前端登录页加载时自动请求验证码 API
- [ ] 验证码区域显示真实图片，非占位文字
- [ ] 点击验证码图片刷新
- [ ] 输入正确验证码可正常登录
- [ ] 验证码错误时提示"验证码错误"
- [ ] 注册页无验证码区域
