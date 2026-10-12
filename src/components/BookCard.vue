<script setup>
import { assetUrl } from '@/lib/config'
defineProps({ book: { type: Object, required: true } })
</script>

<template>
  <RouterLink class="book-card" :to="`/books/${book.id}`">
    <div class="book-cover">
      <img v-if="book.cover_url" :src="assetUrl(book.cover_url)" :alt="`${book.title}封面`" />
      <div v-else class="cover-placeholder">
        <span>云阅</span><strong>{{ book.title }}</strong>
      </div>
    </div>
    <div class="book-card-body">
      <span class="eyebrow">{{ book.category.name }}</span>
      <h3>{{ book.title }}</h3>
      <p>{{ book.author }}</p>
      <small>{{ book.available_count > 0 ? `可借 ${book.available_count} 本` : '暂时借完' }}</small>
    </div>
  </RouterLink>
</template>
