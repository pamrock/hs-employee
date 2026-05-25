# 图形验证码功能实现设计文档

日期: 2026-05-18

## 背景

上一轮登录/注册页面视觉优化中添加了验证码前端占位（客户端随机文本），但未对接后端。现在需要实现真正的图形验证码功能：后端生成验证码图片 + 校验，前端调用真实接口展示图片并提交验证。

## 范围

- 登录接口加验证码，注册不加
- 三个用户端 + 管理端均需要

## 后端设计

### 新增接口 `GET /auth/captcha`

**实现：**
- 使用 Hutool `CaptchaUtil.createLineCaptcha(200, 100, 4, 20)` 生成图片
- 随机生成 captchaId（UUID），验证码文本存 Redis：`captcha:{captchaId}`，TTL 300秒
- 图片转 base64 返回

**响应：**
```json
{
  "success": true,
  "data": {
    "captchaId": "uuid-string",
    "captchaImage": "data:image/png;base64,iVBOR..."
  }
}
```

### 修改 `POST /auth/login`

**LoginRequest 新增字段：**
```java
private String captchaId;
private String captchaCode;
```

**AuthServiceImpl.login() 新增验证逻辑：**
1. 基础参数校验后，先校验验证码
2. 从 Redis 取 `captcha:{captchaId}`
3. key 不存在 → 返回 "验证码已过期，请刷新"
4. 值不匹配（忽略大小写）→ 返回 "验证码错误"，删除 Redis key
5. 匹配成功 → 删除 Redis key，继续走后续登录流程
6. 搜索用户/密码校验失败时，不重新生成验证码要求

**无需新增依赖**，Hutool 已在 pom.xml 中。

## 前端设计

### api/login.js（三个项目均改）

新增函数：
```js
export function getCaptcha() {
  return request.get('/auth/captcha')
}
```

### login.vue（三个项目共 3 个文件）

**改动：**
1. `onMounted` 和 `refreshCaptcha` 调用 `getCaptcha()` API，解析 `captchaId` + `captchaImage`
2. `captcha-img` 区域用 base64 图片替换占位文字展示
3. `refreshCaptcha` 点击时重新请求 API
4. `handleLogin` 请求中附带 `captchaId` 和 `captchaCode`

**示例代码片段：**
```js
const refreshCaptcha = async () => {
  try {
    const res = await getCaptcha()
    if (res.data && res.data.success !== false) {
      captchaId.value = res.data.data.captchaId
      captchaUrl.value = res.data.data.captchaImage
    }
  } catch (e) {
    console.error('获取验证码失败', e)
  }
}
```

模板中 `captcha-img` 区域的 `v-if="!captchaUrl"` 分支（原占位文字）移除或保留作为加载态，优先展示 `<img :src="captchaUrl">`。

### register.vue（三个项目共 3 个文件）

移除验证码输入框、验证码展示区域、captcha 相关 JS 变量和函数。回到注册原有的表单结构（account + username + password）。

## 涉及文件清单

| 项目 | 文件 | 操作 |
|------|------|------|
| pytest | `controller/login/AuthController.java` | 新增 captcha 接口方法 |
| pytest | `dto/request/auth/LoginRequest.java` | 新增 captchaId, captchaCode 字段 |
| pytest | `service/impl/login/AuthServiceImpl.java` | 登录加验证码校验 |
| hs-user | `api/login.js` | 新增 getCaptcha() |
| hs-user | `views/user/login.vue` | 调用真实 API |
| hs-user | `views/user/register.vue` | 移除验证码 |
| hs-employee | `api/login.js` | 新增 getCaptcha() |
| hs-employee | `views/employee/login.vue` | 调用真实 API |
| hs-employee | `views/employee/register.vue` | 移除验证码 |
| my-admin | `api/login.js` | 新增 getCaptcha() |
| my-admin | `views/login/index.vue` | 调用真实 API |
| my-admin | `views/register/index.vue` | 移除验证码 |

## 实现约束

- 后端遵循现有架构模式（Controller → Service，Redis 操作参考现有 `RedisOperateHandler`）
- Hutool CaptchaUtil API 参考文档，生成带干扰线的四位字符验证码
- 前端保持 Vue 3 `<script setup>` + Element Plus 不变
- 验证码不区分大小写
- 每个项目独立创建 feature 分支后修改
