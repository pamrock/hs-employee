# 聊天功能诊断报告

## 问题 1: 初次连接慢

**根因**: 连接过程中存在三层延迟叠加：SockJS 传输协商、STOMP CONNECT 阶段的 Redis 认证查询、以及断线重试的 5 秒等待。

**证据**:

1. **SockJS 传输协商增加 RTT** - hs-employee `stomp.js` 第 19 行：
   ```js
   webSocketFactory: () => new SockJS(wsUrl),
   ```
   未指定 `transports` 参数，SockJS 默认先 GET 请求 `/ws/info` 端点获取服务器信息（一次往返），然后尝试 WebSocket。若 WebSocket 失败（如企业网络限制），还会依次降级为 xhr-streaming、xhr-polling，每次降级都增加额外的往返延迟。

2. **CONNECT 阶段执行 Redis 查询** - `WebSocketAuthInterceptor.java` 第 51 行：
   ```java
   String redisToken = RedisOperateHandler.get("login_token:" + username);
   ```
   每次 STOMP CONNECT 帧都需要查询 Redis 验证 token，Redis 通常有 1-5ms 网络延迟。此外还在第 62 行调用了 `userDetailsService.loadUserByUsername(username)` 加载用户信息，这两步都增加了认证时间。

3. **重连延迟 5 秒** - hs-employee `stomp.js` 第 23 行：
   ```js
   reconnectDelay: 5000,
   ```
   若首次连接失败（如 WebSocket 降级到 XHR），用户需等待 5 秒才能重试。

4. **前端串行初始化加重延迟** - hs-employee `chat.vue` 第 304-313 行：
   ```js
   onMounted(async () => {
     await loadOrderInfo()
     await checkChatStatus()
     await loadHistory()
     connect(token, orderId.value, onMessage, ...)
   })
   ```
   三个 `await` 串行执行后才发起 WebSocket 连接，用户需要等待所有 HTTP 请求完成才能开始连接，而非并行执行。

5. **后端端点配置** - `WebSocketConfig.java` 第 28 行：
   ```java
   .withSockJS();
   ```
   启用了 SockJS，默认不限制传输方式。

**修复建议**:

1. **限定 SockJS 传输类型**：若服务端支持 WebSocket，在 `webSocketFactory` 中限制只能使用 WebSocket，避免 SockJS 的降级探测：
   ```js
   webSocketFactory: () => new SockJS(wsUrl, null, { transports: 'websocket' }),
   ```
   或者直接使用原生 WebSocket 代替 SockJS，彻底消除 `/ws/info` 探测请求。

2. **WebSocket 连接与 HTTP 请求并行化**：将 `chat.vue` `onMounted` 中的串行 await 改为并行，让 WS 连接不与 HTTP 请求串行阻塞：
   ```js
   Promise.all([loadOrderInfo(), checkChatStatus(), loadHistory()]).then(() => { ... })
   connect(token, orderId.value, onMessage, ...)
   ```

3. **减少 CONNECT 阶段的 Redis 查询**：考虑缓存 JWT 解析结果（如将 token 中的用户信息临时缓存到内存），避免每次 CONNECT 都查 Redis。或者将认证信息编码到 JWT claims 中，拦截器只做 JWT 解析而无需额外 Redis 查询。

---

## 问题 2: 图片发不出去

**根因**: Spring Boot 默认的上传文件大小限制（1MB）与前后端允许的 10MB 上限不匹配，导致大于 1MB 的图片被 Spring 拒绝，请求无法到达控制层。此外，上传流程缺少 WebSocket 连接状态检查和乐观 UI。

**证据**:

1. **`application.properties` 缺少 multipart 配置** - 查看 `/Users/pamrock/IdeaProjects/pytest/src/main/resources/application.properties`：
   该文件没有设置 `spring.servlet.multipart.max-file-size` 和 `spring.servlet.multipart.max-request-size`。Spring Boot 3.x 默认值为 **1MB**。而 `MessageController.java` 第 98 行允许上传 **10MB** 的图片：
   ```java
   if (file.getSize() > 10 * 1024 * 1024) {
       return ResultMsg.error("图片大小不能超过10MB");
   }
   ```
   前端的验证同样允许 10MB（hs-employee `chat.vue` 第 255 行）：
   ```js
   const isLt10M = file.size / 1024 / 1024 < 10
   ```
   前后端都允许 10MB，但 Spring 默认的 1MB 限制会在 `MultipartResolver` 阶段直接拒绝 1MB 以上的请求，返回 400 错误，永远不会执行到 `MessageController.uploadImage()` 方法。

2. **上传流程缺少 WebSocket 连通性检查** - hs-employee `chat.vue` 第 267-281 行：
   ```js
   const handleUploadImage = async (options) => {
     const res = await uploadChatImage(orderId.value, options.file)
     const url = res.data
     if (url) {
       sendMessage(orderId.value, {   // <-- 如果此时 WS 断连，sendMessage 静默丢弃
         orderId: orderId.value,
         msgType: 'image',
         imageUrl: url
       })
     }
   }
   ```
   图片上传到 OSS 是 HTTP 请求，但发送图片消息依赖 WebSocket。如果图片上传成功但此时 WebSocket 恰好断连，`sendMessage()` 在第 63 行 `if (!stompClient || !stompClient.connected) return` 会静默丢弃消息，用户看到 OSS 上传成功但图片并未发出。

3. **缺少乐观 UI 和加载状态** - `handleUploadImage` 没有像 `handleSend` 那样立即插入一条"发送中"状态的占位消息，用户在上传期间没有任何视觉反馈，只能等待上传完成。

**修复建议**:

1. **在 `application.properties` 中显式配置 multipart 大小**：
   ```properties
   spring.servlet.multipart.max-file-size=10MB
   spring.servlet.multipart.max-request-size=10MB
   ```
   使其与业务层验证保持一致。

2. **增加 WebSocket 状态检查与重试机制**：在调用 `sendMessage()` 前检查 `isConnected()`，若断连则暂存待发送的图片 URL，待 WS 重连后再发送：
   ```js
   const pendingImageMessages = ref([])

   const handleUploadImage = async (options) => {
     const res = await uploadChatImage(orderId.value, options.file)
     const url = res.data
     if (url) {
       const msg = { orderId: orderId.value, msgType: 'image', imageUrl: url }
       if (isConnected()) {
         sendMessage(orderId.value, msg)
       } else {
         pendingImageMessages.value.push(msg)  // 暂存待重连后发送
       }
     }
   }
   ```
   并在 WS `onConnect` 回调中发送暂存消息。

3. **增加乐观 UI 和加载指示**：上传前先插入一条带加载动画的占位消息，上传完成后再替换为实际图片，提升用户体验。

---

## 问题 3: 消息顺序出错

**根因**: 多层反转逻辑叠加导致消息顺序完全错乱。后端按 ASC（正序，旧->新）返回分页数据，但前端 `loadHistory` 将其反转，`loadMore` 再次反转，且 `loadMore` 加载的是更新的页面（页码递增），导致新旧消息在数组中交叉排列。

**证据**:

1. **后端 SQL 返回 ASC 顺序** - `HsOrderMessageMapper.xml` 第 12 行：
   ```sql
   order by create_time asc
   ```
   分页查询按时间正序（旧到新）返回。Page 1 = 最早的 20 条，Page 2 = 第 21-40 条（比 Page 1 更新），以此类推。

2. **`loadHistory` 反转数组（hs-employee）** - hs-employee `chat.vue` 第 180 行：
   ```js
   messages.value = list.length > 0 ? [...list].reverse() : []
   ```
   将 ASC 数组反转后，`messages[0]` = 最新消息，`messages[end]` = 最旧消息。显示顺序变为：最新消息在顶部，最旧消息在底部 —— 与正常聊天界面相反。当 `scrollToBottom()` 被调用时，用户看到的是最旧的消息，而非最新的。

3. **`loadMore` 再次反转并前置拼接** - hs-employee `chat.vue` 第 154 行：
   ```js
   messages.value = [...list.reverse(), ...messages.value]
   ```
   - `loadMore` 调用 `pageNo: nextPage`（第 2 页开始），获取比当前显示的**更新**的消息
   - `list.reverse()` 将 ASC 反转后：第 40 条（最更新）在前，第 21 条（较旧）在后
   - 前置拼接后：最新的 Page 2 消息（40,39,...,21）被放到当前数组的开头，而当前数组中 Page 1 的消息（20,19,...,1）在后面
   - 最终显示：`[40, 39, ..., 21, 20, 19, ..., 1]`
   - 前 20 条是更新的消息（来自第 2 页），后 20 条是更旧的消息（来自第 1 页），顺序完全混淆

4. **hs-user 版表现不一致** - hs-user `chat.vue` 第 178 行：
   ```js
   messages.value = data.records || []
   ```
   hs-user 版 `loadHistory` **没有反转**，所以初始显示顺序正确（最旧消息在顶，最新在底）。但 `loadMore` 第 160 行仍然做了 `list.reverse()` 反转，所以加载更多后顺序同样出错。

5. **乐观 ID 碰撞风险** - hs-employee `chat.vue` 第 232 行：
   ```js
   const optimisticId = Date.now()
   ```
   使用毫秒级时间戳作为乐观 ID。快速连续发送多条消息（<1ms 间隔）时，多条消息会获得相同 ID，导致 `onMessage` 的去重逻辑混淆。

6. **去重逻辑匹配不准确** - hs-employee `chat.vue` 第 295 行：
   ```js
   const idx = messages.value.findIndex(m => m.id > 1e12 && m.content === msg.content && m.senderRole === msg.senderRole)
   ```
   使用 `m.content === msg.content`（内容相等）作为去重条件，而非使用时间戳或唯一 ID 区间。导致：
   - 连续发送两条相同文本消息时，服务端回包会错误地替换同一条本地消息，第二条变成重复
   - 两个不同用户发送相同内容时也可能触发误匹配

**修复建议**:

1. **移除 `loadHistory` 中的 `reverse()`**：后端已按 ASC 返回，前端应直接使用原始顺序。`messages[0]` = 最旧（顶部），`messages[end]` = 最新（底部）。`loadMore` 中应使用 `messages.value = [...list, ...messages.value]`（不反转），因为新加载的页面也是 ASC，且其中的消息在时间上早于当前数组中的第一条消息。

2. **修正分页方向**：当前页码递增获取的是更新的消息（与"加载更早历史"的语义相反）。应当改为 `order by create_time desc`，然后在前端不反转直接展示。或者保持 ASC 但让 `loadMore` 加载的是消息 ID / 时间戳比当前第一条更小的数据，而非递增页码。

3. **改进去重逻辑**：使用更精确的匹配方式。例如在乐观消息中嵌入一个唯一的前端生成的 `_clientId`（如 UUID），去重时基于 `_clientId` 而非 `content` 匹配：
   ```js
   // handleSend 中
   const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
   const localMsg = { id: Date.now(), _clientId: clientId, ... }

   // onMessage 中
   const idx = messages.value.findIndex(m => m._clientId === msg._clientId)
   ```
