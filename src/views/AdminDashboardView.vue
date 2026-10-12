<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import NoticeBox from '@/components/NoticeBox.vue'

const stats = ref(null)
const error = ref('')
onMounted(async () => {
  try {
    stats.value = await api('/admin/dashboard')
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">ADMIN OVERVIEW</span>
    <h1>管理首页</h1>
    <p>馆藏和借阅，一目了然。</p>
  </div>
  <NoticeBox :message="error" />
  <div v-if="stats" class="stats-grid">
    <article
      v-for="[key, title, note] in [
        ['active_loans', '当前有效借阅', '正在阅读'],
        ['all_loans', '累计借阅', '所有历史记录'],
        ['books', '馆藏图书', '含已下架'],
        ['users', '读者账号', '普通账号'],
        ['pending_renewals', '待审核续借', '需要处理'],
      ]"
      :key="key"
      class="stat-card"
    >
      <span class="eyebrow">{{ title }}</span
      ><strong>{{ stats[key] }}</strong>
      <p>{{ note }}</p>
    </article>
  </div>
  <div class="admin-shortcuts">
    <RouterLink class="button primary" to="/admin/books">管理图书</RouterLink
    ><RouterLink class="button soft" to="/admin/loans">查看借阅与续借</RouterLink>
  </div>
</template>
