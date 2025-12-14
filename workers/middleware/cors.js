const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1'])

const parseUrl = (value) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const resolveAllowedOrigins = (request) => {
  const allowedHosts = new Set(loopbackHosts)
  if (!request) {
    return allowedHosts
  }
  const url = parseUrl(request.url)
  if (url?.hostname) {
    allowedHosts.add(url.hostname)
  }
  return allowedHosts
}

const isOriginAllowed = (origin, allowedHosts) => {
  if (!origin) return true
  const parsed = parseUrl(origin)
  if (!parsed) return false
  return allowedHosts.has(parsed.hostname)
}

const getCorsHeaders = (origin, allowedHosts) => {
  if (isOriginAllowed(origin, allowedHosts) && origin) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  }
  return {}
}

const withCors = (response, origin, allowedHosts) => {
  const headers = new Headers(response.headers)
  const cors = getCorsHeaders(origin, allowedHosts)
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

const handleCorsOptions = (request, allowedHosts) => {
  const origin = request.headers.get('Origin')
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin, allowedHosts),
  })
}

const corsGuard = async (c, next) => {
  const allowedHosts = resolveAllowedOrigins(c.req.raw)
  const origin = c.req.header('Origin')
  if (!isOriginAllowed(origin, allowedHosts)) {
    return withCors(new Response('Forbidden', { status: 403 }), origin, allowedHosts)
  }
  await next()
  if (origin && c.res && c.res.status >= 200) {
    c.res = withCors(c.res, origin, allowedHosts)
  }
}

export { corsGuard, handleCorsOptions, resolveAllowedOrigins, withCors }
