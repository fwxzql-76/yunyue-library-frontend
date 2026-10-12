<script setup>
import { onMounted, reactive, ref } from 'vue'
import { api, query } from '@/lib/api'
import BookCard from '@/components/BookCard.vue'
import NoticeBox from '@/components/NoticeBox.vue'

const categories = ref([])
const results = ref({ items: [], total: 0, page: 1, page_size: 12 })
const filters = reactive({ search: '', category_id: '', page: 1, page_size: 12 })
const error = ref('')
const loading = ref(false)
async function load() {
  loading.value = true
  error.value = ''
  try {
    results.value = await api(`/books?${query(filters)}`)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
function search() {
  filters.page = 1
  load()
}
function reset() {
  filters.search = ''
  filters.category_id = ''
  filters.page = 1
  load()
}
function changePage(delta) {
  filters.page += delta
  load()
}
onMounted(async () => {
  try {
    categories.value = await api('/categories')
  } catch (err) {
    error.value = err.message
  }
  await load()
})
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">THE COLLECTION</span>
    <h1>借阅图书</h1>
    <p>按分类或书名寻找喜欢的故事。</p>
  </div>
  <form class="filter-bar" @submit.prevent="search">
    <label class="sr-only" for="book-search">搜索书名或作者</label
    ><input id="book-search" v-model="filters.search" placeholder="搜索书名或作者" />
    <label class="sr-only" for="book-category">图书分类</label
    ><select id="book-category" v-model="filters.category_id">
      <option value="">全部分类</option>
      <option v-for="category in categories" :key="category.id" :value="category.id">
        {{ category.name }}
      </option>
    </select>
    <button class="button primary">搜索</button
    ><button class="button soft" type="button" @click="reset">重置</button>
  </form>
  <NoticeBox :message="error" />
  <div class="results-caption">共 {{ results.total }} 本图书</div>
  <div v-if="results.items.length" class="book-grid">
    <BookCard v-for="book in results.items" :key="book.id" :book="book" />
  </div>
  <p v-else class="empty-state">{{ loading ? '正在加载…' : '没有找到符合条件的图书。' }}</p>
  <div v-if="results.total > filters.page_size" class="pagination">
    <button class="button soft" :disabled="filters.page <= 1" @click="changePage(-1)">上一页</button
    ><span>第 {{ filters.page }} / {{ Math.ceil(results.total / filters.page_size) }} 页</span
    ><button
      class="button soft"
      :disabled="filters.page >= Math.ceil(results.total / filters.page_size)"
      @click="changePage(1)"
    >
      下一页
    </button>
  </div>
</template>
