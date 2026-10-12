<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import BookCard from '@/components/BookCard.vue'
import NoticeBox from '@/components/NoticeBox.vue'

const books = ref([])
const error = ref('')
onMounted(async () => {
  try {
    books.value = await api('/favorites')
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">YOUR SHELF</span>
    <h1>我的收藏</h1>
    <p>把心动的书，留在这里。</p>
  </div>
  <NoticeBox :message="error" />
  <div v-if="books.length" class="book-grid">
    <BookCard v-for="book in books" :key="book.id" :book="book" />
  </div>
  <div v-else class="empty-state">
    还没有收藏图书。<RouterLink to="/books">去逛逛馆藏 →</RouterLink>
  </div>
</template>
