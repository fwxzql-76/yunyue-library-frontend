<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { clearSession, user } from '@/lib/auth'
import { api } from '@/lib/api'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const route = useRoute()
const actionArea = ref(null)
const openMenu = ref('')
const messages = ref([])
const messageError = ref('')
const isReading = computed(() => route.name === 'read')
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
const avatarText = computed(() => user.value?.username?.slice(0, 1).toUpperCase() || '云')

async function toggleMessages() {
  openMenu.value = openMenu.value === 'messages' ? '' : 'messages'
  if (openMenu.value !== 'messages') return
  messageError.value = ''
  try {
    if (user.value?.role === 'admin') {
      const items = await api('/admin/renewals')
      messages.value = items
        .filter((item) => item.status === 'pending')
        .map((item) => ({
          id: item.id,
          title: '待处理续借',
          text: `${item.loan.user.username} 申请续借《${item.loan.book.title}》`,
          to: '/admin/loans',
        }))
    } else {
      const items = await api('/announcements')
      messages.value = items.map((item) => ({
        id: item.id,
        title: item.title,
        text: item.content,
        to: '/',
      }))
    }
  } catch (err) {
    messageError.value = err.message
  }
}

function closeOnOutside(event) {
  if (actionArea.value && !actionArea.value.contains(event.target)) openMenu.value = ''
}
function closeOnEscape(event) {
  if (event.key === 'Escape') openMenu.value = ''
}
onMounted(() => {
  document.addEventListener('pointerdown', closeOnOutside)
  document.addEventListener('keydown', closeOnEscape)
})
onUnmounted(() => {
  document.removeEventListener('pointerdown', closeOnOutside)
  document.removeEventListener('keydown', closeOnEscape)
})
watch(
  () => route.fullPath,
  () => {
    openMenu.value = ''
  },
)
function logout() {
  openMenu.value = ''
  clearSession()
  router.push('/login')
}
</script>

<template>
  <div class="site-frame" :class="{ 'reading-mode': isReading }">
    <header class="site-header">
      <RouterLink class="brand" :to="user?.role === 'admin' ? '/admin' : '/'">
        <span class="brand-mark">云</span><span>云阅图书馆</span>
      </RouterLink>
      <template v-if="user && !$route.meta.guest">
        <nav v-if="!user.must_change_password" class="main-nav" aria-label="主导航">
          <RouterLink v-for="[path, label] in links" :key="path" :to="path">{{ label }}</RouterLink>
        </nav>
        <div ref="actionArea" class="account-actions">
          <ThemeToggle />
          <div class="header-action-wrap">
            <button
              type="button"
              class="header-icon-button"
              aria-label="消息"
              title="消息"
              :aria-expanded="openMenu === 'messages'"
              @click="toggleMessages"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 12h4" />
              </svg>
            </button>
            <div v-if="openMenu === 'messages'" class="header-popover messages-popover">
              <strong>消息</strong>
              <p v-if="messageError" class="popover-note">{{ messageError }}</p>
              <p v-else-if="!messages.length" class="popover-note">暂无消息</p>
              <RouterLink
                v-for="item in messages"
                :key="item.id"
                :to="item.to"
                class="message-item"
                @click="openMenu = ''"
              >
                <span>{{ item.title }}</span
                ><small>{{ item.text }}</small>
              </RouterLink>
            </div>
          </div>
          <div class="header-action-wrap">
            <button
              type="button"
              class="avatar-button"
              :aria-label="`${user.username}，打开账号菜单`"
              :aria-expanded="openMenu === 'account'"
              title="账号"
              @click="openMenu = openMenu === 'account' ? '' : 'account'"
            >
              {{ avatarText }}
            </button>
            <div v-if="openMenu === 'account'" class="header-popover account-popover">
              <strong>{{ user.username }}</strong>
              <small>{{ user.role === 'admin' ? '管理员' : '读者' }}</small>
              <button type="button" class="popover-action" @click="logout">退出登录</button>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="guest-actions">
        <ThemeToggle />
        <RouterLink class="text-button" to="/login">登录</RouterLink>
      </div>
    </header>
    <main class="page-shell" :class="{ 'reader-shell': isReading }"><RouterView /></main>
    <footer v-if="!isReading" class="site-footer">在文字里相遇 · 云阅图书馆</footer>
  </div>
</template>
