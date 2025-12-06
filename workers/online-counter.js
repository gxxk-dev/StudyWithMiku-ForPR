export class OnlineCounter {
  constructor(state, env) {
    this.state = state
    this.env = env
    this.sessions = []
  }

  async fetch(request) {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    this.state.acceptWebSocket(server)
    this.sessions.push(server)
    
    this.broadcast()

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async webSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message)
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }))
      }
    } catch (err) {
      console.error('Parse error:', err)
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    ws.close(1000, 'Goodbye')
    this.sessions = this.sessions.filter(s => s !== ws)
    this.broadcast()
  }

  async webSocketError(ws, error) {
    this.sessions = this.sessions.filter(s => s !== ws)
    this.broadcast()
  }

  broadcast() {
    const count = this.sessions.length
    const message = JSON.stringify({ type: 'count', count })
    
    this.sessions = this.sessions.filter(session => {
      try {
        session.send(message)
        return true
      } catch (err) {
        return false
      }
    })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    
    if (url.pathname === '/ws') {
      const upgradeHeader = request.headers.get('Upgrade')
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
      }
      
      const id = env.ONLINE_COUNTER.idFromName('global')
      const stub = env.ONLINE_COUNTER.get(id)
      return stub.fetch(request)
    }

    if (url.pathname === '/count') {
      return new Response(JSON.stringify({ count: 0 }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response('OK', { status: 200 })
  },
}
