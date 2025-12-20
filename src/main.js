import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')

// PWA Service Worker 注册
import { registerSW } from 'virtual:pwa-register'

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.location.reload()
    },
    onOfflineReady() {
      console.log('✓ PWA 离线就绪')
    },
    onRegistered(registration) {
      console.log('✓ Service Worker 已注册')
    },
    onRegisterError(error) {
      console.error('✗ Service Worker 注册失败:', error)
    }
  })
}
