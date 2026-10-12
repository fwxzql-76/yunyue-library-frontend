import { ref } from 'vue'
import { apiOrigin } from './config'

let savedUser = null
try {
  savedUser = JSON.parse(localStorage.getItem('yunyue_user') || 'null')
} catch {
  localStorage.removeItem('yunyue_user')
}
export const token = ref(localStorage.getItem('yunyue_token'))
export const user = ref(savedUser)
let checked = false

export function setSession(data) {
  token.value = data.token
  user.value = data.user
  localStorage.setItem('yunyue_token', data.token)
  localStorage.setItem('yunyue_user', JSON.stringify(data.user))
  checked = true
}

export function clearSession() {
  token.value = null
  user.value = null
  localStorage.removeItem('yunyue_token')
  localStorage.removeItem('yunyue_user')
  checked = true
}

export async function ensureSession() {
  if (!token.value) return null
  if (checked) return user.value
  try {
    const response = await fetch(`${apiOrigin}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token.value}` },
    })
    if (response.status === 401) {
      clearSession()
      return null
    }
    if (!response.ok) throw new Error('暂时无法验证登录状态')
    user.value = await response.json()
    localStorage.setItem('yunyue_user', JSON.stringify(user.value))
    checked = true
  } catch {
    return user.value
  }
  return user.value
}
