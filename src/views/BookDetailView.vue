<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/config'
import NoticeBox from '@/components/NoticeBox.vue'

const route = useRoute()
const router = useRouter()
const book = ref(null)
const favorite = ref(false)
const activeLoan = ref(null)
const error = ref('')
const info = ref('')
const busy = ref(false)
async function load() {
  error.value = ''
  try {
    const [detail, favorites, loans] = await Promise.all([
      api(`/books/${route.params.id}`),
      api('/favorites'),
      api('/loans/mine'),
    ])
    book.value = detail
    favorite.value = favorites.some((item) => item.id === detail.id)
    activeLoan.value =
      loans.find((item) => item.book.id === detail.id && item.status === 'active') || null
  } catch (err) {
    error.value = err.message
  }
}
async function toggleFavorite() {
  try {
    await api(`/books/${book.value.id}/favorite`, { method: favorite.value ? 'DELETE' : 'POST' })
    favorite.value = !favorite.value
  } catch (err) {
    error.value = err.message
  }
}
async function borrow() {
  busy.value = true
  error.value = ''
  info.value = ''
  try {
    await api(`/books/${book.value.id}/borrow`, { method: 'POST' })
    await load()
    info.value = '借阅成功，现在可以在线阅读。'
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
watch(() => route.params.id, load)
onMounted(load)
</script>

<template>
  <button class="back-link" type="button" @click="router.back()">← 返回</button>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <article v-if="book" class="detail-layout">
    <div class="detail-cover">
      <img v-if="book.cover_url" :src="assetUrl(book.cover_url)" :alt="`${book.title}封面`" />
      <div v-else class="cover-placeholder">
        <span>云阅</span><strong>{{ book.title }}</strong>
      </div>
    </div>
    <div class="detail-content">
      <span class="eyebrow">{{ book.category.name }}</span>
      <h1>{{ book.title }}</h1>
      <p class="detail-author">{{ book.author }} 著</p>
      <div class="detail-meta">
        <span>{{
          book.available_count > 0 ? `剩余 ${book.available_count} 个借阅名额` : '当前暂无借阅名额'
        }}</span
        ><span>借期 14 天</span
        ><span>{{ book.formats.map((x) => x.toUpperCase()).join(' / ') }}</span>
      </div>
      <h2>内容简介</h2>
      <p class="description">{{ book.description || '这本书暂无详细介绍。' }}</p>
      <div class="button-row">
        <RouterLink v-if="activeLoan" class="button primary" :to="`/read/${book.id}`"
          >开始阅读</RouterLink
        ><button
          v-else
          class="button primary"
          :disabled="busy || book.available_count <= 0 || !book.formats.length"
          @click="borrow"
        >
          {{ busy ? '正在借阅…' : '立即借阅' }}</button
        ><button class="button soft" @click="toggleFavorite">
          {{ favorite ? '♥ 已收藏' : '♡ 收藏图书' }}
        </button>
      </div>
      <p v-if="activeLoan" class="helper-text">
        已借阅。你可以在“我的借阅”中查看期限、续借或归还。
      </p>
    </div>
  </article>
</template>
