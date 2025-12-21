# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Study with Miku - 一个「Study with Miku」企划主题的番茄钟应用，让 Miku 陪伴学习。

## 常用命令

```bash
# 开发
npm run dev              # 启动 Vite 开发服务器 (端口 3000)
npm run dev:worker       # 构建并启动本地 Cloudflare Worker

# 构建
npm run build            # 生成图标 + Vite 构建 + 复制静态资源

# 部署
npm run deploy:worker    # 部署到 Cloudflare Workers
```

## 架构

### 前端 (Vue 3 + Vite)

- `src/App.vue` - 主应用：视频背景、APlayer 音乐播放器、全屏控制
- `src/components/PomodoroTimer.vue` - 番茄钟组件：计时器、设置面板(番茄钟/歌单/缓存)、服务器选择
- `src/composables/` - Vue Composables
  - `useMusic.js` - 音乐源管理，支持本地歌曲和 Meting API (网易云/QQ音乐等)
  - `useOnlineCount.js` - WebSocket 在线人数
  - `useServerConfig.js` - 计数服务器配置
  - `useCache.js` - 缓存管理 (Service Worker/localStorage/内存)
- `src/services/meting.js` - Meting API 封装，获取歌单
- `src/utils/` - 工具函数
  - `eventBus.js` - 事件总线，管理 APlayer 实例和 UI 交互状态
  - `userSettings.js` - 用户设置持久化 (番茄钟时长、视频/音乐索引)
  - `cache.js` - 资源加载和预加载
  - `audioPrefetch.js` - 音频预加载

### 后端 (Cloudflare Workers + Durable Objects)

- `workers/index.js` - Hono 路由入口
  - `GET /ws` - WebSocket 连接
  - `GET /count` - 获取在线人数
- `workers/online-counter.js` - Durable Object 实现在线计数
- `wrangler.toml` - Worker 配置，包含 Durable Objects 绑定

### PWA

- `vite.config.js` 中配置 VitePWA 插件
- Service Worker 缓存策略：视频/音频 CacheFirst，API NetworkFirst
- 支持离线使用

## 工作流程

- GitHub Flow
- 提交规范：约定式提交 (Conventional Commits)
