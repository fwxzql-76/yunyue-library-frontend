<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, json, query } from '@/lib/api'
import { dateTime } from '@/lib/format'
import NoticeBox from '@/components/NoticeBox.vue'

const accounts = ref({ items: [], total: 0 })
const page = ref(1)
const searchText = ref('')
const form = reactive({ username: '', temporary_password: '' })
const error = ref('')
const info = ref('')
async function load() {
  try {
    accounts.value = await api(
      `/admin/accounts?${query({ search: searchText.value, page: page.value, page_size: 20 })}`,
    )
  } catch (err) {
    error.value = err.message
  }
}
function runSearch() {
  page.value = 1
  load()
}
function resetSearch() {
  searchText.value = ''
  runSearch()
}
function changePage(delta) {
  page.value += delta
  load()
}
async function createAdmin() {
  error.value = ''
  info.value = ''
  try {
    await json('POST', '/admin/accounts', { ...form })
    form.username = ''
    form.temporary_password = ''
    info.value = '管理员账号已创建。首次登录需修改临时密码。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function toggle(account) {
  const action = account.is_active ? '停用' : '启用'
  if (
    !confirm(
      `确定${action}账号 ${account.username} 吗？${account.is_active ? '停用会结束该账号的有效借阅。' : ''}`,
    )
  )
    return
  error.value = ''
  info.value = ''
  try {
    await json('PATCH', `/admin/accounts/${account.id}/status`, { is_active: !account.is_active })
    info.value = `账号已${action}。`
    await load()
  } catch (err) {
    error.value = err.message
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">ACCOUNT MANAGEMENT</span>
    <h1>账号管理</h1>
    <p>查看读者，管理账号状态。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <section class="form-panel small-panel">
    <h2>创建管理员</h2>
    <p class="muted">管理员只能由现有管理员创建，首次登录必须修改临时密码。</p>
    <form class="stack-form" @submit.prevent="createAdmin">
      <div class="form-grid">
        <label
          >用户名<input
            v-model="form.username"
            required
            minlength="3"
            maxlength="32"
            pattern="[A-Za-z0-9_-]+" /></label
        ><label
          >临时密码<input
            v-model="form.temporary_password"
            required
            minlength="8"
            type="password"
            autocomplete="new-password"
        /></label>
      </div>
      <button class="button primary">创建管理员</button>
    </form>
  </section>
  <section class="section-block">
    <div class="section-title">
      <h2>账号列表</h2>
      <span class="muted">共 {{ accounts.total }} 个账号</span>
    </div>
    <div class="filter-bar">
      <input v-model="searchText" placeholder="搜索用户名" @keyup.enter="runSearch" /><button
        class="button primary"
        @click="runSearch"
      >
        搜索</button
      ><button class="button soft" @click="resetSearch">重置</button>
    </div>
    <div v-if="accounts.items.length" class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>创建时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="account in accounts.items" :key="account.id">
            <td>
              <strong>{{ account.username }}</strong>
            </td>
            <td>{{ account.role === 'admin' ? '管理员' : '读者' }}</td>
            <td>{{ dateTime(account.created_at) }}</td>
            <td>
              <span class="status-pill" :class="account.is_active ? 'active' : 'expired'">{{
                account.is_active ? '启用' : '停用'
              }}</span>
            </td>
            <td>
              <button
                v-if="account.role === 'reader'"
                class="text-button"
                :class="{ 'danger-text': account.is_active }"
                @click="toggle(account)"
              >
                {{ account.is_active ? '停用' : '启用' }}</button
              ><span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="empty-state">没有找到账号。</p>
    <div v-if="accounts.total > 20" class="pagination">
      <button class="button soft" :disabled="page <= 1" @click="changePage(-1)">上一页</button
      ><span>第 {{ page }} / {{ Math.ceil(accounts.total / 20) }} 页</span
      ><button
        class="button soft"
        :disabled="page >= Math.ceil(accounts.total / 20)"
        @click="changePage(1)"
      >
        下一页
      </button>
    </div>
  </section>
</template>
