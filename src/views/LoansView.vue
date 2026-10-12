<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/config'
import { dateTime, loanStatus } from '@/lib/format'
import NoticeBox from '@/components/NoticeBox.vue'

const loans = ref([])
const error = ref('')
const info = ref('')
async function load() {
  try {
    loans.value = await api('/loans/mine')
  } catch (err) {
    error.value = err.message
  }
}
async function renew(loan) {
  error.value = ''
  info.value = ''
  try {
    const result = await api(`/loans/${loan.id}/renew`, { method: 'POST' })
    info.value =
      result.kind === 'extended'
        ? '续借成功，借阅期限已延长 7 天。'
        : '续借申请已提交，等待管理员审核。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function returnLoan(loan) {
  if (!confirm(`确定归还《${loan.book.title}》吗？归还后将无法继续阅读。`)) return
  error.value = ''
  info.value = ''
  try {
    await api(`/loans/${loan.id}/return`, { method: 'POST' })
    info.value = '已归还，阅读权限已结束。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">READING HISTORY</span>
    <h1>我的借阅</h1>
    <p>阅读、续借和归还，都在这里。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <div v-if="loans.length" class="loan-list">
    <article v-for="loan in loans" :key="loan.id" class="loan-card">
      <div class="loan-cover">
        <img
          v-if="loan.book.cover_url"
          :src="assetUrl(loan.book.cover_url)"
          :alt="`${loan.book.title}封面`"
        /><span v-else>云阅</span>
      </div>
      <div class="loan-content">
        <div class="loan-heading">
          <RouterLink :to="`/books/${loan.book.id}`"
            ><h2>{{ loan.book.title }}</h2></RouterLink
          ><span class="status-pill" :class="loan.status">{{ loanStatus[loan.status] }}</span>
        </div>
        <p>{{ loan.book.author }} · {{ loan.book.category.name }}</p>
        <div class="loan-dates">
          <span>借阅：{{ dateTime(loan.borrowed_at) }}</span
          ><span>到期：{{ dateTime(loan.due_at) }}</span>
        </div>
        <p v-if="loan.pending_renewal" class="helper-text">续借申请待管理员审核</p>
        <div v-if="loan.status === 'active'" class="button-row compact">
          <RouterLink class="button primary" :to="`/read/${loan.book.id}`">继续阅读</RouterLink
          ><button class="button soft" :disabled="loan.pending_renewal" @click="renew(loan)">
            {{ loan.self_renewal_used ? '申请续借' : '续借 7 天' }}</button
          ><button class="button ghost" @click="returnLoan(loan)">归还</button>
        </div>
      </div>
    </article>
  </div>
  <div v-else class="empty-state">
    还没有借阅记录。<RouterLink to="/books">去找一本书 →</RouterLink>
  </div>
</template>
