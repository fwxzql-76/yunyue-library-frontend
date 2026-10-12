<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, json, query } from '@/lib/api'
import { assetUrl } from '@/lib/config'
import NoticeBox from '@/components/NoticeBox.vue'

const items = ref([])
const books = ref({ items: [], total: 0 })
const bookSearch = ref('')
const editing = ref(null)
const form = reactive({ book_id: '', recommendation: '', sort_order: 0, cover: null })
const error = ref('')
const info = ref('')
async function findBooks() {
  try {
    books.value = await api(`/admin/books?${query({ search: bookSearch.value, page_size: 48 })}`)
  } catch (err) {
    error.value = err.message
  }
}
async function load() {
  try {
    items.value = await api('/admin/carousel')
    await findBooks()
  } catch (err) {
    error.value = err.message
  }
}
function edit(item) {
  editing.value = item.id
  if (!books.value.items.some((book) => book.id === item.book.id))
    books.value.items.unshift(item.book)
  Object.assign(form, {
    book_id: item.book.id,
    recommendation: item.recommendation,
    sort_order: item.sort_order,
    cover: null,
  })
  scrollTo({ top: 0, behavior: 'smooth' })
}
function reset() {
  editing.value = null
  Object.assign(form, { book_id: '', recommendation: '', sort_order: 0, cover: null })
  const input = document.querySelector('.carousel-editor input[type=file]')
  if (input) input.value = ''
}
async function save() {
  error.value = ''
  info.value = ''
  try {
    const item = await json(
      editing.value ? 'PATCH' : 'POST',
      editing.value ? `/admin/carousel/${editing.value}` : '/admin/carousel',
      editing.value
        ? { recommendation: form.recommendation, sort_order: Number(form.sort_order) }
        : {
            book_id: Number(form.book_id),
            recommendation: form.recommendation,
            sort_order: Number(form.sort_order),
          },
    )
    if (form.cover) {
      const data = new FormData()
      data.append('cover_file', form.cover)
      await api(`/admin/carousel/${item.id}/cover`, { method: 'POST', body: data })
    }
    info.value = '推荐已保存。'
    reset()
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function remove(item) {
  if (!confirm(`确定移除《${item.book.title}》的推荐吗？`)) return
  try {
    await api(`/admin/carousel/${item.id}`, { method: 'DELETE' })
    info.value = '推荐已移除。'
    await load()
  } catch (err) {
    error.value = err.message
  }
}
onMounted(load)
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">FEATURED BOOKS</span>
    <h1>轮播管理</h1>
    <p>挑选值得与读者分享的书。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <section class="form-panel carousel-editor">
    <div class="section-title">
      <h2>{{ editing ? '编辑推荐' : '新增推荐' }}</h2>
      <button v-if="editing" class="button ghost" @click="reset">取消</button>
    </div>
    <form class="stack-form" @submit.prevent="save">
      <div v-if="!editing" class="inline-form">
        <input
          v-model="bookSearch"
          placeholder="搜索要推荐的书名或作者"
          @keyup.enter.prevent="findBooks"
        /><button type="button" class="button soft" @click="findBooks">查找图书</button>
      </div>
      <label
        >图书<select v-model="form.book_id" :disabled="!!editing" required>
          <option disabled value="">请选择图书</option>
          <option
            v-for="book in books.items.filter((x) => x.is_listed || x.id === form.book_id)"
            :key="book.id"
            :value="book.id"
          >
            {{ book.title }} — {{ book.author }}
          </option>
        </select></label
      ><label
        >推荐语<textarea v-model="form.recommendation" maxlength="300" rows="3" required></textarea>
      </label>
      <div class="form-grid">
        <label>排序（数字越小越靠前）<input v-model.number="form.sort_order" type="number" /></label
        ><label
          >轮播封面（可选）<input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            @change="form.cover = $event.target.files?.[0] || null"
        /></label>
      </div>
      <button class="button primary">保存推荐</button>
    </form>
    <p v-if="books.total > 48" class="helper-text">结果较多时请按书名或作者搜索。</p>
  </section>
  <section class="section-block">
    <h2>当前推荐</h2>
    <div v-if="items.length" class="management-list">
      <article v-for="item in items" :key="item.id" class="management-item carousel-item">
        <div class="small-cover">
          <img
            v-if="item.cover_url"
            :src="assetUrl(item.cover_url)"
            :alt="`${item.book.title}封面`"
          /><span v-else>云阅</span>
        </div>
        <div class="flex-grow">
          <span class="eyebrow">顺序 {{ item.sort_order }}</span>
          <h3>{{ item.book.title }}</h3>
          <p>{{ item.recommendation }}</p>
        </div>
        <div class="button-row compact">
          <button class="button soft small" @click="edit(item)">编辑</button
          ><button class="button ghost small danger-text" @click="remove(item)">移除</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">暂无轮播推荐。</p>
  </section>
</template>
