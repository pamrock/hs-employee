import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let stompClient = null
let subscriptions = {}

export function connect(token, orderId, onMessage, onConnected, onError) {
  if (stompClient && stompClient.connected) {
    subscribeToOrder(orderId, onMessage)
    if (onConnected) onConnected()
    return
  }

  const wsUrl = import.meta.env.DEV
    ? '/api/ws'
    : 'https://admint.pamrock.top/api/ws'

  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: {
      token: token
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      subscribeToOrder(orderId, onMessage)
      if (onConnected) onConnected()
    },
    onDisconnect: () => {},
    onStompError: (frame) => {
      const msg = frame.headers['message'] || ''
      console.error('STOMP error:', msg)
      // Auth failures: force-stop reconnect loop
      if (msg && (msg.includes('token') || msg.includes('session') || msg.includes('login'))) {
        if (stompClient) {
          stompClient.reconnectDelay = 0
          stompClient.deactivate()
        }
        stompClient = null
        Object.values(subscriptions).forEach(sub => sub.unsubscribe())
        subscriptions = {}
        if (onError) onError(msg)
      }
    }
  })

  stompClient.activate()
}

function subscribeToOrder(orderId, onMessage) {
  const topic = `/topic/order/${orderId}`
  if (subscriptions[topic]) {
    subscriptions[topic].unsubscribe()
  }
  subscriptions[topic] = stompClient.subscribe(topic, (message) => {
    const body = JSON.parse(message.body)
    if (onMessage) onMessage(body)
  })
}

export function sendMessage(orderId, chatMessage) {
  if (!stompClient || !stompClient.connected) return
  stompClient.publish({
    destination: `/app/order/${orderId}/message`,
    body: JSON.stringify(chatMessage)
  })
}

export function disconnect() {
  Object.values(subscriptions).forEach(sub => sub.unsubscribe())
  subscriptions = {}
  if (stompClient) {
    stompClient.reconnectDelay = 0
    stompClient.deactivate()
  }
  stompClient = null
}

export function isConnected() {
  return stompClient && stompClient.connected
}
