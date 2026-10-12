<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { dateTime, loanStatus, renewalStatus } from '@/lib/format'
import NoticeBox from '@/components/NoticeBox.vue'

const loans = ref({ items: [], total: 0 })
const renewals = ref([])
const page = ref(1)
const error = ref('')
const info = ref('')
async function load() {
  try {
    ;[loans.value, renewals.value] = await Promise.all([
      api(`/admin/loans?page=${page.value}&page_size=20`),
      api('/admin/renewals'),
    ])
  } catch (err) {
    error.value = err.message
  }
}
function changePage(delta) {
  page.value += delta
  load()
}
async function review(item, decision) {
  error.value = ''
  info.value = ''
  try {
    await api(`/admin/renewals/${item.id}/${decision}`, { method: 'POST' })
    info.value = decision === 'approve' ? '已批准续借。' : '已拒绝续借。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function endLoan(loan) {
  if (!confirm(`确定手动结束 ${loan.user.username} 借阅的《${loan.book.title}》吗？`)) return
  try {
    await api(`/admin/loans/${loan.id}/end`, { method: 'POST' })
    info.value = '借阅已结束。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">BORROWING MANAGEMENT</span>
    <h1>借阅管理</h1>
    <p>查看借阅状态，处理续借请求。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <section class="section-block">
    <div class="section-title">
      <h2>续借申请</h2>
      <span class="muted"
        >待审核 {{ renewals.filter((x) => x.status === 'pending').length }} 项</span
      >
    </div>
    <div v-if="renewals.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>读者</th>
            <th>图书</th>
            <th>申请时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in renewals" :key="item.id">
            <td>{{ item.loan.user.username }}</td>
            <td>{{ item.loan.book.title }}</td>
            <td>{{ dateTime(item.requested_at) }}</td>
            <td>
              <span class="status-pill" :class="item.status">{{ renewalStatus[item.status] }}</span>
            </td>
            <td>
              <div v-if="item.status === 'pending'" class="button-row compact">
                <button class="button primary small" @click="review(item, 'approve')">通过</button
                ><button class="button soft small" @click="review(item, 'reject')">拒绝</button>
              </div>
              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-state">暂无续借申请。</p>
  </section>
  <section class="section-block">
    <div class="section-title">
      <h2>借阅记录</h2>
      <span class="muted">共 {{ loans.total }} 条</span>
    </div>
    <div v-if="loans.items.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>读者</th>
            <th>图书</th>
            <th>借阅时间</th>
            <th>到期时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="loan in loans.items" :key="loan.id">
            <td>{{ loan.user.username }}</td>
            <td>{{ loan.book.title }}</td>
            <td>{{ dateTime(loan.borrowed_at) }}</td>
            <td>{{ dateTime(loan.due_at) }}</td>
            <td>
              <span class="status-pill" :class="loan.status">{{ loanStatus[loan.status] }}</span>
            </td>
            <td>
              <button
                v-if="loan.status === 'active'"
                class="text-button danger-text"
                @click="endLoan(loan)"
              >
                手动结束</button
              ><span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-state">暂无借阅记录。</p>
    <div v-if="loans.total > 20" class="pagination">
      <button class="button soft" :disabled="page <= 1" @click="changePage(-1)">上一页</button
      ><span>第 {{ page }} / {{ Math.ceil(loans.total / 20) }} 页</span
      ><button
        class="button soft"
        :disabled="page >= Math.ceil(loans.total / 20)"
        @click="changePage(1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>
