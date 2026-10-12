<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { clearSession, user } from '@/lib/auth'

const router = useRouter()
const readerLinks = [
  ['/', '大厅'],
  ['/books', '借阅图书'],
  ['/favorites', '我的收藏'],
  ['/loans', '我的借阅'],
]
const adminLinks = [
  ['/admin', '首页'],
  ['/admin/books', '图书管理'],
  ['/admin/loans', '借阅管理'],
  ['/admin/carousel', '轮播管理'],
  ['/admin/announcements', '公告管理'],
  ['/admin/accounts', '账号管理'],
]
const links = computed(() => (user.value?.role === 'admin' ? adminLinks : readerLinks))
function logout() {
  clearSession()
  router.push('/login')
}
</script>

<template>
  <div class="site-frame">
    <header class="site-header">
      <RouterLink class="brand" :to="user?.role === 'admin' ? '/admin' : '/'">
        <span class="brand-mark">云</span><span>云阅图书馆</span>
      </RouterLink>
      <template v-if="user && !$route.meta.guest">
        <nav v-if="!user.must_change_password" class="main-nav" aria-label="主导航">
          <RouterLink v-for="[path, label] in links" :key="path" :to="path">{{ label }}</RouterLink>
        </nav>
        <div class="account-actions">
          <span class="account-name"
            >{{ user.username }}<small>{{ user.role === 'admin' ? '管理员' : '读者' }}</small></span
          >
          <button type="button" class="text-button" @click="logout">退出</button>
        </div>
      </template>
      <RouterLink v-else class="text-button" to="/login">登录</RouterLink>
    </header>
    <main class="page-shell"><RouterView /></main>
    <footer class="site-footer">在文字里相遇 · 云阅图书馆</footer>
  </div>
</template>
