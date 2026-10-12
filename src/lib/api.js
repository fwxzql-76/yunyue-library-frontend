import { clearSession, token } from './auth'
import { apiOrigin } from './config'

export async function api(path, options = {}) {
  const headers = { ...options.headers }
  if (token.value) headers.Authorization = `Bearer ${token.value}`
  if (options.body && !(options.body instanceof FormData))
    headers['Content-Type'] = 'application/json'
  let response
  try {
    response = await fetch(`${apiOrigin}/api${path}`, { ...options, headers })
  } catch {
    throw new Error('无法连接服务，请确认后端已启动')
  }
  if (!response.ok) {
    let error
    try {
      error = await response.json()
    } catch {
      error = {}
    }
    if (response.status === 401 && !path.startsWith('/auth/login')) clearSession()
    throw new Error(typeof error.detail === 'string' ? error.detail : '操作失败，请稍后重试')
  }
  if (options.asBlob) return response.blob()
  return response.status === 204 ? null : response.json()
}

export const json = (method, path, body) => api(path, { method, body: JSON.stringify(body) })

export function query(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) search.set(key, String(value))
  }
  return search.toString()
}
