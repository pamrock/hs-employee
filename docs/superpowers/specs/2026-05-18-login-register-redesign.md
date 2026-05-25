# 登录/注册页面视觉优化设计文档

日期: 2026-05-18

## 背景

家政服务系统包含三个前端项目，登录和注册页面目前视觉单调：
- **hs-user（用户端）**: 纯白背景 + 基本表单
- **hs-employee（员工端）**: 纯白背景 + 基本表单
- **my-admin（管理端）**: 渐变背景 + 简单浮动圆

需要统一优化视觉，同时新增验证码和记住密码功能。

## 设计决策

### 整体策略
- C 端（用户端 + 员工端）共享同一套视觉方案：绿色渐变 + 毛玻璃卡片，温暖清新
- 管理端独立方案：图片背景 + 暗色遮罩 + 毛玻璃卡片，专业沉稳

### 配色方案

**C 端（绿色清新）：**
- 背景渐变: `linear-gradient(135deg, #a8e6cf 0%, #88d8b0 25%, #6ecba0 60%, #56c596 100%)`
- 主色按钮: `linear-gradient(135deg, #52b788, #40916c)`
- 卡片: `rgba(255,255,255,0.88)` + `backdrop-filter: blur(12px)`
- 输入框背景: `#f6fdf9`
- 文字主色: `#2d6a4f`, 辅助色: `#52b788`

**管理端（深蓝专业）：**
- 背景: 图片 + 深色遮罩（暗色渐变叠加）
- 主色按钮: `linear-gradient(135deg, #1a1a2e, #0f3460)`
- 卡片: `rgba(255,255,255,0.9)` + `backdrop-filter: blur(16px)`
- 输入框背景: `#f5f7fa`
- 文字主色: `#1a1a2e`, 辅助色: `#7f8c8d`

### 装饰元素

**C 端：**
- 2-3 个不同大小的半透明白色圆形，分散在背景不同位置
- 透明度: 0.05-0.08

**管理端：**
- 2-3 个半透明圆形（蓝紫色调）
- 细网格线纹理
- 管理端背景：默认使用 CSS 渐变作为后备（`linear-gradient(135deg, #1a1a2e, #0f3460)`），同时准备 `background-image` 接口可接入真实家居场景图片。图片使用时叠加暗色遮罩 `rgba(0,0,0,0.55)` 保证文字可读性

### 毛玻璃卡片
- C 端: `border-radius: 18px`, `box-shadow: 0 8px 32px rgba(0,0,0,0.08)`
- 管理端: `border-radius: 16px`, `box-shadow: 0 16px 48px rgba(0,0,0,0.25)`, `border: 1px solid rgba(255,255,255,0.2)`

## 涉及文件

| 项目 | 文件路径 | 说明 |
|------|---------|------|
| hs-user | `src/views/user/login.vue` | 用户登录 |
| hs-user | `src/views/user/register.vue` | 用户注册 |
| hs-employee | `src/views/employee/login.vue` | 员工登录 |
| hs-employee | `src/views/employee/register.vue` | 员工注册 |
| my-admin | `src/views/login/index.vue` | 管理端登录 |
| my-admin | `src/views/register/index.vue` | 管理端注册 |

## 新增功能

### 验证码（三个端统一）

登录和注册表单增加验证码字段：
- 验证码输入框（占位：请输入验证码）
- 验证码图片/展示区域，点击可刷新
- 登录时提交验证码给后端验证
- 注册时同样需要输入验证码

验证码 API：
- 获取验证码: `GET /api/captcha`，返回 `{ data: { captchaId: string, image: base64string } }`
- 提交时附带 captchaId 和用户输入的 code
- 前端页面挂载时自动请求验证码
- 点击验证码图片/区域触发刷新
- 若后端暂未提供验证码接口，前端先展示占位文字"ABCD"作为 UI 占位，不阻塞页面展示

### 记住密码（三个端统一）

- 登录表单增加 remember me checkbox
- 勾选后密码存入 localStorage，下次自动填充
- 取消勾选则清除已存储的密码
- 所有端共享此实现逻辑
- localStorage key: 用户端 `user_remember`, 员工端 `employee_remember`, 管理端 `admin_remember`
- 存储格式: `{ username: string, password: string }`，读取时自动填充表单
- 页面挂载时检查 localStorage，若有则自动填充并勾选 checkbox

## 实现约束

- 不修改现有 API 调用逻辑（路由跳转、token 存储等保持不变）
- 保持 Vue 3 `<script setup>` 语法
- 保持 Element Plus 组件库
- C 端移动端优先（max-width: 480px）
- 管理端居中布局（max-width: 400px）
- 每个项目的 logo/emoji 图标可根据角色适当差异化（用户🏠/员工🧹/管理📊）

## 结构

每个 login.vue / register.vue 页面结构：
```
<template>
  <div class="auth-container">
    <div class="auth-bg">          <!-- 渐变/图片背景 -->
      <div class="bg-shapes">       <!-- 装饰圆形 -->
    </div>
    <div class="auth-card">         <!-- 毛玻璃卡片 -->
      <div class="auth-header">     <!-- Logo + 标题 -->
      <div class="auth-form">       <!-- 表单区域 -->
        <!-- 手机号/邮箱/用户名 -->
        <!-- 密码 -->
        <!-- 验证码（输入框 + 展示图） -->
        <!-- 记住密码 checkbox -->
        <!-- 登录/注册按钮 -->
      <div class="auth-footer">     <!-- 链接 -->
    </div>
  </div>
</template>
```

C 端用户和员工页面可通过参数配置不同的标题和 icon，保持模板一致。不抽取共享组件，直接复制修改（减少跨项目依赖）。
