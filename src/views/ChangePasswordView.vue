<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { json } from '@/lib/api'
import { setSession, user } from '@/lib/auth'
import NoticeBox from '@/components/NoticeBox.vue'

const router = useRouter()
const form = reactive({ old_password: '', new_password: '', confirm: '' })
const error = ref('')
const busy = ref(false)
async function submit() {
  error.value = ''
  if (form.new_password !== form.confirm) {
    error.value = '两次输入的新密码不一致'
    return
  }
  busy.value = true
  try {
    setSession(
      await json('POST', '/auth/change-password', {
        old_password: form.old_password,
        new_password: form.new_password,
      }),
    )
    await router.push(user.value.role === 'admin' ? '/admin' : '/')
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section class="form-panel narrow centered">
    <span class="eyebrow">ACCOUNT SECURITY</span>
    <h1>设置新密码</h1>
    <p class="muted">首次登录需要修改临时密码，修改后才能使用系统。</p>
    <form class="stack-form" @submit.prevent="submit">
      <label
        >当前密码<input
          v-model="form.old_password"
          type="password"
          required
          autocomplete="current-password"
      /></label>
      <label
        >新密码<input
          v-model="form.new_password"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
      /></label>
      <label
        >确认新密码<input
          v-model="form.confirm"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
      /></label>
      <NoticeBox :message="error" />
      <button class="button primary" :disabled="busy">保存新密码</button>
    </form>
  </section>
</template>
