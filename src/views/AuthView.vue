<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { json } from '@/lib/api'
import { setSession } from '@/lib/auth'
import NoticeBox from '@/components/NoticeBox.vue'

const route = useRoute()
const router = useRouter()
const registering = computed(() => route.name === 'register')
const form = reactive({ username: '', password: '', confirm: '' })
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  if (registering.value && form.password !== form.confirm) {
    error.value = '两次输入的密码不一致'
    return
  }
  busy.value = true
  try {
    const result = await json('POST', registering.value ? '/auth/register' : '/auth/login', {
      username: form.username.trim(),
      password: form.password,
    })
    setSession(result)
    await router.push(
      result.user.must_change_password
        ? '/change-password'
        : result.user.role === 'admin'
          ? '/admin'
          : route.query.redirect || '/',
    )
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="auth-layout">
    <div class="auth-intro">
      <span class="eyebrow">WELCOME TO YUNYUE</span>
      <h1>让每一次翻页，<br />都有新的发现。</h1>
      <p>收藏喜欢的书，借阅后在线阅读 PDF 与 EPUB，随时回到自己的阅读角落。</p>
      <div class="quote-card">“阅读，是一座随身携带的避难所。”<span>— 毛姆</span></div>
    </div>
    <section class="auth-card">
      <span class="eyebrow">{{ registering ? 'CREATE ACCOUNT' : 'WELCOME BACK' }}</span>
      <h2>{{ registering ? '创建读者账号' : '登录云阅' }}</h2>
      <p class="muted">{{ registering ? '加入云阅，开始你的线上借阅。' : '继续你的阅读旅程。' }}</p>
      <form @submit.prevent="submit" class="stack-form">
        <label
          >用户名<input
            v-model="form.username"
            required
            minlength="3"
            maxlength="32"
            pattern="[A-Za-z0-9_-]+"
            autocomplete="username"
            placeholder="3–32 位字母、数字或 _ -"
        /></label>
        <label
          >密码<input
            v-model="form.password"
            required
            :minlength="registering ? 8 : 1"
            type="password"
            :autocomplete="registering ? 'new-password' : 'current-password'"
            placeholder="请输入密码"
        /></label>
        <label v-if="registering"
          >确认密码<input
            v-model="form.confirm"
            required
            minlength="8"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
        /></label>
        <NoticeBox :message="error" />
        <button class="button primary full" :disabled="busy">
          {{ busy ? '请稍候…' : registering ? '注册并进入' : '登录' }}
        </button>
      </form>
      <p class="switch-auth">
        {{ registering ? '已有账号？' : '还没有账号？' }}
        <RouterLink :to="registering ? '/login' : '/register'">{{
          registering ? '去登录' : '注册读者账号'
        }}</RouterLink>
      </p>
    </section>
  </div>
</template>
