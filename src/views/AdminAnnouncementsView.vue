<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, json } from '@/lib/api'
import { dateTime } from '@/lib/format'
import NoticeBox from '@/components/NoticeBox.vue'

const items = ref([])
const editing = ref(null)
const form = reactive({ title: '', content: '', is_visible: true })
const error = ref('')
const info = ref('')
async function load() {
  try {
    items.value = await api('/admin/announcements')
  } catch (err) {
    error.value = err.message
  }
}
function edit(item) {
  editing.value = item.id
  Object.assign(form, { title: item.title, content: item.content, is_visible: item.is_visible })
  scrollTo({ top: 0, behavior: 'smooth' })
}
function reset() {
  editing.value = null
  Object.assign(form, { title: '', content: '', is_visible: true })
}
async function save() {
  error.value = ''
  info.value = ''
  try {
    await json(
      editing.value ? 'PATCH' : 'POST',
      editing.value ? `/admin/announcements/${editing.value}` : '/admin/announcements',
      { ...form },
    )
    info.value = editing.value ? '公告已更新。' : '公告已发布。'
    reset()
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function remove(item) {
  if (!confirm(`确定删除公告“${item.title}”吗？`)) return
  try {
    await api(`/admin/announcements/${item.id}`, { method: 'DELETE' })
    info.value = '公告已删除。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">NOTICE BOARD</span>
    <h1>公告管理</h1>
    <p>向读者发布图书馆消息。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <section class="form-panel">
    <div class="section-title">
      <h2>{{ editing ? '编辑公告' : '发布公告' }}</h2>
      <button v-if="editing" class="button ghost" @click="reset">取消</button>
    </div>
    <form class="stack-form" @submit.prevent="save">
      <label>标题<input v-model="form.title" maxlength="160" required /></label
      ><label>内容<textarea v-model="form.content" rows="5" required></textarea></label
      ><label class="checkbox-line"
        ><input v-model="form.is_visible" type="checkbox" /> 对读者显示</label
      ><button class="button primary">{{ editing ? '保存修改' : '发布公告' }}</button>
    </form>
  </section>
  <section class="section-block">
    <h2>全部公告</h2>
    <div v-if="items.length" class="management-list">
      <article v-for="item in items" :key="item.id" class="management-item">
        <div>
          <span class="eyebrow"
            >{{ dateTime(item.created_at) }} · {{ item.is_visible ? '公开' : '隐藏' }}</span
          >
          <h3>{{ item.title }}</h3>
          <p>{{ item.content }}</p>
        </div>
        <div class="button-row compact">
          <button class="button soft small" @click="edit(item)">编辑</button
          ><button class="button ghost small danger-text" @click="remove(item)">删除</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">暂无公告。</p>
  </section>
</template>
