<template>
  <div>
    <div 
      class="countdown-clock" 
      :class="{ 'settings-open': showSettings }"
      @click="toggleSettings"
    >
      <div class="online-indicator">
        <span class="online-dot" :class="{ connected: isConnected }"></span>
        <span class="online-text">{{ onlineCount }}</span>
      </div>
      <div class="clock-display">
        <span class="minutes">{{ formattedMinutes }}</span>
        <span class="separator">:</span>
        <span class="seconds">{{ formattedSeconds }}</span>
      </div>
      <div class="status-badge" :class="statusClass">
        {{ statusText }}
      </div>
    </div>
    <transition name="fade">
      <div v-if="showSettings" class="settings-overlay" @click.self="closeSettings">
        <div class="settings-panel">
          <div class="settings-header">
            <h3>番茄钟设置</h3>
            <button class="close-btn" @click="closeSettings">×</button>
          </div>
          
          <div class="timer-container">
            <div class="status-indicator">
              <span class="status-text" :class="statusClass">{{ statusText }}</span>
            </div>
            
            <div class="timer-display">
              <div class="time-circle">
                <svg class="progress-ring" width="120" height="120">
                  <circle
                    class="progress-ring-background"
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255, 255, 255, 0.2)"
                    stroke-width="5"
                    fill="transparent"
                  />
                  <circle
                    class="progress-ring-fill"
                    :class="statusClass"
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="currentColor"
                    stroke-width="5"
                    fill="transparent"
                    :stroke-dasharray="circumference"
                    :stroke-dashoffset="strokeDashoffset"
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div class="time-text">
                  <span class="minutes">{{ formattedMinutes }}</span>
                  <span class="separator">:</span>
                  <span class="seconds">{{ formattedSeconds }}</span>
                </div>
              </div>
            </div>
            
            <div class="timer-controls">
              <button 
                v-if="!isRunning" 
                class="control-btn start-btn" 
                @click="startTimer"
                :disabled="timeLeft <= 0"
              >
                <span class="btn-icon">▶</span>
              </button>
              <button 
                v-else 
                class="control-btn pause-btn" 
                @click="pauseTimer"
              >
                <span class="btn-icon">⏸</span>
              </button>
              <button 
                class="control-btn reset-btn" 
                @click="resetTimer"
              >
                <span class="btn-icon">↺</span>
              </button>
            </div>
            
            <div class="timer-settings">
              <div class="setting-group">
                <label>专注时间(分钟)</label>
                <input 
                  type="number" 
                  v-model.number="focusDuration" 
                  min="1" 
                  max="60"
                  :disabled="isRunning"
                />
              </div>
              <div class="setting-group">
                <label>休息时间(分钟)</label>
                <input 
                  type="number" 
                  v-model.number="breakDuration" 
                  min="1" 
                  max="30"
                  :disabled="isRunning"
                />
              </div>
            </div>
            
            <div class="pomodoro-count">
              <span class="count-label">已完成番茄:</span>
              <div class="count-display">
                <span 
                  v-for="i in 4" 
                  :key="i" 
                  class="pomodoro-dot"
                  :class="{ filled: completedPomodoros >= i }"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useOnlineCount } from '../composables/useOnlineCount.js'

const WS_URL = 'wss://study-with-miku-onlinecounter.1839192968.workers.dev/ws'
const { onlineCount, isConnected } = useOnlineCount(WS_URL)

const STATUS = {
  FOCUS: 'focus',
  BREAK: 'break',
  LONG_BREAK: 'longBreak'
}

const timeLeft = ref(25 * 60)
const isRunning = ref(false)
const currentStatus = ref(STATUS.FOCUS)
const focusDuration = ref(25)
const breakDuration = ref(5)
const completedPomodoros = ref(0)
const showSettings = ref(false)
watch(focusDuration, (newVal) => {
  if (currentStatus.value === STATUS.FOCUS && !isRunning.value) {
    timeLeft.value = newVal * 60
  }
})

watch(breakDuration, (newVal) => {
  if (currentStatus.value !== STATUS.FOCUS && !isRunning.value) {
    timeLeft.value = newVal * 60
  }
})

let timer = null

const formattedMinutes = computed(() => {
  return Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
})

const formattedSeconds = computed(() => {
  return (timeLeft.value % 60).toString().padStart(2, '0')
})

const statusText = computed(() => {
  switch (currentStatus.value) {
    case STATUS.FOCUS: return '专注'
    case STATUS.BREAK: return '休息'
    case STATUS.LONG_BREAK: return '长休'
    default: return '专注'
  }
})

const statusClass = computed(() => {
  switch (currentStatus.value) {
    case STATUS.FOCUS: return 'focus'
    case STATUS.BREAK: return 'break'
    case STATUS.LONG_BREAK: return 'long-break'
    default: return 'focus'
  }
})

const circumference = computed(() => 2 * Math.PI * 54)
const strokeDashoffset = computed(() => {
  const totalTime = currentStatus.value === STATUS.FOCUS 
    ? focusDuration.value * 60 
    : breakDuration.value * 60
  const progress = (totalTime - timeLeft.value) / totalTime
  return circumference.value * (1 - progress)
})

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const closeSettings = () => {
  showSettings.value = false
}

const startTimer = () => {
  if (timeLeft.value <= 0) return
  isRunning.value = true
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      clearInterval(timer)
      handleTimerComplete()
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const resetTimer = () => {
  pauseTimer()
  timeLeft.value = focusDuration.value * 60
  currentStatus.value = STATUS.FOCUS
}

const handleTimerComplete = () => {
  playNotificationSound()
  
  if (currentStatus.value === STATUS.FOCUS) {
    completedPomodoros.value++
    
    if (completedPomodoros.value % 4 === 0) {
      currentStatus.value = STATUS.LONG_BREAK
      timeLeft.value = breakDuration.value * 60 * 2
    } else {
      currentStatus.value = STATUS.BREAK
      timeLeft.value = breakDuration.value * 60
    }
  } else {
    currentStatus.value = STATUS.FOCUS
    timeLeft.value = focusDuration.value * 60
  }
  
  showNotification()
  
  setTimeout(() => {
    startTimer()
  }, 1000)
}

const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800
  gainNode.gain.value = 0.1
  
  oscillator.start()
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5)
  oscillator.stop(audioContext.currentTime + 0.5)
}

const showNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('番茄钟', {
      body: `${statusText.value}已完成！`,
      icon: '/favicon.ico'
    })
  }
}

onMounted(() => {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.countdown-clock {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1001;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
  font-family: 'Courier New', monospace;
}

.online-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  transition: background 0.3s ease;
}

.online-dot.connected {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
}

.online-text {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.9;
}

.countdown-clock:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-50%) translateY(-2px);
}

.countdown-clock.settings-open {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.clock-display {
  font-size: 1.5rem;
  font-weight: 600;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
}

.status-badge.focus {
  color: #ff6b6b;
}

.status-badge.break {
  color: #4ecdc4;
}

.status-badge.long-break {
  color: #45b7d1;
}

/* 设置页面样式 */
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
}

.settings-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(30px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-header h3 {
  color: white;
  margin: 0;
  font-size: 1.2rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 原有番茄钟样式 */
.timer-container {
  padding: 1.5rem;
  text-align: center;
  color: white;
}

.status-indicator {
  margin-bottom: 1rem;
}

.status-text {
  font-size: 1rem;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
}

.status-text.focus {
  color: #ff6b6b;
}

.status-text.break {
  color: #4ecdc4;
}

.status-text.long-break {
  color: #45b7d1;
}

.timer-display {
  margin-bottom: 1.5rem;
}

.time-circle {
  position: relative;
  display: inline-block;
}

.progress-ring {
  display: block;
  width: 120px;
  height: 120px;
}

.progress-ring-fill.focus {
  color: #ff6b6b;
}

.progress-ring-fill.break {
  color: #4ecdc4;
}

.progress-ring-fill.long-break {
  color: #45b7d1;
}

.time-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: 300;
  font-family: 'Courier New', monospace;
}

.timer-controls {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.control-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
}

.pause-btn {
  background: rgba(255, 193, 7, 0.3);
  border-color: rgba(255, 193, 7, 0.5);
}

.reset-btn {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.5);
}

.btn-icon {
  font-size: 1rem;
}

.timer-settings {
  margin-bottom: 1rem;
}

.setting-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  font-size: 0.8rem;
}

.setting-group label {
  opacity: 0.8;
}

.setting-group input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  padding: 0.2rem 0.4rem;
  color: white;
  width: 50px;
  text-align: center;
}

.setting-group input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
}

.setting-group input:disabled {
  opacity: 0.5;
}

.pomodoro-count {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  opacity: 0.8;
}

.count-display {
  display: flex;
  gap: 0.2rem;
}

.pomodoro-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: background 0.3s ease;
}

.pomodoro-dot.filled {
  background: #ff6b6b;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>