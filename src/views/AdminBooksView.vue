<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, json, query } from '@/lib/api'
import NoticeBox from '@/components/NoticeBox.vue'

const categories = ref([])
const result = ref({ items: [], total: 0 })
const searchText = ref('')
const page = ref(1)
const selected = ref([])
const editing = ref(null)
const error = ref('')
const info = ref('')
const busy = ref(false)
const categoryName = ref('')
const form = reactive({
  title: '',
  author: '',
  description: '',
  category_id: '',
  max_active_loans: 1,
  is_listed: true,
  cover: null,
  pdf: null,
  epub: null,
})

async function load() {
  try {
    result.value = await api(
      `/admin/books?${query({ search: searchText.value, page: page.value, page_size: 12 })}`,
    )
  } catch (err) {
    error.value = err.message
  }
}
function edit(book) {
  editing.value = book.id
  Object.assign(form, {
    title: book.title,
    author: book.author,
    description: book.description,
    category_id: book.category.id,
    max_active_loans: book.max_active_loans,
    is_listed: book.is_listed,
    cover: null,
    pdf: null,
    epub: null,
  })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function resetForm() {
  editing.value = null
  Object.assign(form, {
    title: '',
    author: '',
    description: '',
    category_id: categories.value[0]?.id || '',
    max_active_loans: 1,
    is_listed: true,
    cover: null,
    pdf: null,
    epub: null,
  })
  for (const input of document.querySelectorAll('.book-editor input[type=file]')) input.value = ''
}
function setFile(key, event) {
  form[key] = event.target.files?.[0] || null
}
async function save() {
  error.value = ''
  info.value = ''
  busy.value = true
  try {
    if (editing.value) {
      const current = result.value.items.find((book) => book.id === editing.value)
      const uploadFiles = async () => {
        if (form.cover) {
          const data = new FormData()
          data.append('cover_file', form.cover)
          await api(`/admin/books/${editing.value}/cover`, { method: 'POST', body: data })
        }
        for (const name of ['pdf', 'epub'])
          if (form[name]) {
            const data = new FormData()
            data.append('file', form[name])
            await api(`/admin/books/${editing.value}/files/${name}`, { method: 'POST', body: data })
          }
      }
      const needFileBeforeRelist = form.is_listed && current?.formats.length === 0
      if (needFileBeforeRelist) await uploadFiles()
      await json('PATCH', `/admin/books/${editing.value}`, {
        title: form.title,
        author: form.author,
        description: form.description,
        category_id: Number(form.category_id),
        max_active_loans: Number(form.max_active_loans),
        is_listed: form.is_listed,
      })
      if (!needFileBeforeRelist) await uploadFiles()
      info.value = '图书信息已更新。'
    } else {
      const data = new FormData()
      for (const key of ['title', 'author', 'description', 'category_id', 'max_active_loans'])
        data.append(key, String(form[key]))
      if (form.cover) data.append('cover_file', form.cover)
      if (form.pdf) data.append('pdf_file', form.pdf)
      if (form.epub) data.append('epub_file', form.epub)
      await api('/admin/books', { method: 'POST', body: data })
      info.value = '图书已上传并上架。'
    }
    resetForm()
    await load()
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}
async function removeFormat(name) {
  if (!confirm(`确定移除这本书的 ${name.toUpperCase()} 文件吗？`)) return
  try {
    await api(`/admin/books/${editing.value}/files/${name}`, { method: 'DELETE' })
    info.value = `${name.toUpperCase()} 文件已移除`
    await load()
  } catch (err) {
    error.value = err.message
  }
}
async function addCategory() {
  error.value = ''
  try {
    await json('POST', '/admin/categories', { name: categoryName.value })
    categories.value = await api('/categories')
    categoryName.value = ''
    info.value = '分类已添加。'
  } catch (err) {
    error.value = err.message
  }
}
async function delist() {
  if (!selected.value.length || !confirm(`确定下架选中的 ${selected.value.length} 本图书吗？`))
    return
  try {
    await json('POST', '/admin/books/delist', { ids: selected.value })
    selected.value = []
    info.value = '选中图书已下架。'
    await load()
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
onMounted(async () => {
  try {
    categories.value = await api('/categories')
    resetForm()
    await load()
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">BOOK COLLECTION</span>
    <h1>图书管理</h1>
    <p>上传、编辑和管理可借阅名额。</p>
  </div>
  <NoticeBox :message="error" /><NoticeBox :message="info" kind="success" />
  <section class="form-panel book-editor">
    <div class="section-title">
      <h2>{{ editing ? `编辑图书 #${editing}` : '上传新图书' }}</h2>
      <button v-if="editing" class="button ghost" @click="resetForm">取消编辑</button>
    </div>
    <form class="stack-form" @submit.prevent="save">
      <div class="form-grid">
        <label>书名<input v-model="form.title" required maxlength="160" /></label
        ><label>作者<input v-model="form.author" required maxlength="120" /></label>
      </div>
      <label>内容简介<textarea v-model="form.description" rows="4"></textarea></label>
      <div class="form-grid">
        <label
          >分类<select v-model="form.category_id" required>
            <option disabled value="">请选择分类</option>
            <option v-for="item in categories" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select></label
        ><label
          >同时借阅名额<input v-model.number="form.max_active_loans" type="number" min="0" required
        /></label>
      </div>
      <label v-if="editing" class="checkbox-line"
        ><input v-model="form.is_listed" type="checkbox" /> 上架展示</label
      >
      <div class="form-grid file-grid">
        <label
          >封面（JPG / PNG / WebP）<input
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            @change="setFile('cover', $event)" /></label
        ><label
          >PDF 文件<input
            type="file"
            accept=".pdf,application/pdf"
            @change="setFile('pdf', $event)" /></label
        ><label
          >EPUB 文件<input
            type="file"
            accept=".epub,application/epub+zip"
            @change="setFile('epub', $event)"
        /></label>
      </div>
      <p class="helper-text">
        {{
          editing
            ? '只上传需要替换的文件；原有文件会保留。'
            : '至少上传 PDF 或 EPUB 一种格式。PDF / EPUB 最大 40 MB，封面最大 5 MB。'
        }}
      </p>
      <div v-if="editing" class="button-row compact">
        <span>移除现有格式：</span
        ><button
          v-for="name in result.items.find((x) => x.id === editing)?.formats || []"
          :key="name"
          class="button ghost"
          type="button"
          @click="removeFormat(name)"
        >
          移除 {{ name.toUpperCase() }}
        </button>
      </div>
      <button class="button primary" :disabled="busy">
        {{ busy ? '正在保存…' : editing ? '保存修改' : '上传图书' }}
      </button>
    </form>
  </section>
  <section class="section-block">
    <div class="section-title">
      <h2>图书列表</h2>
      <span class="muted">共 {{ result.total }} 本</span>
    </div>
    <div class="filter-bar">
      <input v-model="searchText" placeholder="搜索书名或作者" @keyup.enter="runSearch" /><button
        class="button primary"
        @click="runSearch"
      >
        搜索</button
      ><button class="button soft" @click="resetSearch">重置</button
      ><button class="button danger" :disabled="!selected.length" @click="delist">
        批量下架 ({{ selected.length }})
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th><span class="sr-only">选择</span></th>
            <th>图书</th>
            <th>分类</th>
            <th>借阅名额</th>
            <th>格式</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="book in result.items" :key="book.id">
            <td>
              <input
                v-model="selected"
                type="checkbox"
                :value="book.id"
                :aria-label="`选择${book.title}`"
              />
            </td>
            <td>
              <strong>{{ book.title }}</strong
              ><small>{{ book.author }}</small>
            </td>
            <td>{{ book.category.name }}</td>
            <td>{{ book.available_count }} / {{ book.max_active_loans }}</td>
            <td>{{ book.formats.map((x) => x.toUpperCase()).join(' / ') || '—' }}</td>
            <td>
              <span class="status-pill" :class="book.is_listed ? 'active' : 'expired'">{{
                book.is_listed ? '已上架' : '已下架'
              }}</span>
            </td>
            <td><button class="text-button" @click="edit(book)">编辑</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="!result.items.length" class="empty-state">暂无图书。</p>
    <div v-if="result.total > 12" class="pagination">
      <button class="button soft" :disabled="page <= 1" @click="changePage(-1)">上一页</button
      ><span>第 {{ page }} / {{ Math.ceil(result.total / 12) }} 页</span
      ><button
        class="button soft"
        :disabled="page >= Math.ceil(result.total / 12)"
        @click="changePage(1)"
      >
        下一页
      </button>
    </div>
  </section>
  <section class="form-panel small-panel">
    <h2>添加分类</h2>
    <form class="inline-form" @submit.prevent="addCategory">
      <input v-model="categoryName" required maxlength="40" placeholder="新分类名称" /><button
        class="button soft"
      >
        添加
      </button>
    </form>
  </section>
</template>
