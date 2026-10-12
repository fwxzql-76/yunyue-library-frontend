<script setup>
import { onMounted, ref } from 'vue'
import { api } from '@/lib/api'
import { assetUrl } from '@/lib/config'
import BookCard from '@/components/BookCard.vue'
import NoticeBox from '@/components/NoticeBox.vue'

const featured = ref([])
const announcements = ref([])
const latest = ref([])
const active = ref(0)
const error = ref('')
let timer
onMounted(async () => {
  try {
    const [slides, notes, books] = await Promise.all([
      api('/carousel'),
      api('/announcements'),
      api('/books?page_size=4'),
    ])
    featured.value = slides
    announcements.value = notes
    latest.value = books.items
    if (slides.length > 1)
      timer = setInterval(() => {
        active.value = (active.value + 1) % slides.length
      }, 6000)
  } catch (err) {
    error.value = err.message
  }
})
import { onUnmounted } from 'vue'
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="page-heading">
    <span class="eyebrow">YOUR READING SPACE</span>
    <h1>今天，从哪一页开始？</h1>
    <p>好书与故事，随时为你打开。</p>
  </div>
  <NoticeBox :message="error" />
  <section v-if="featured.length" class="hero-slide">
    <div class="hero-copy">
      <span class="eyebrow">本期推荐 · {{ String(active + 1).padStart(2, '0') }}</span>
      <h2>{{ featured[active].book.title }}</h2>
      <p class="hero-author">{{ featured[active].book.author }}</p>
      <p>{{ featured[active].recommendation }}</p>
      <RouterLink class="button primary" :to="`/books/${featured[active].book.id}`"
        >走进这本书 <span aria-hidden="true">↗</span></RouterLink
      >
      <div class="slide-dots">
        <button
          v-for="(slide, index) in featured"
          :key="slide.id"
          type="button"
          :class="{ selected: active === index }"
          :aria-label="`查看第 ${index + 1} 项推荐`"
          @click="active = index"
        ></button>
      </div>
    </div>
    <div class="hero-art">
      <img
        v-if="featured[active].cover_url"
        :src="assetUrl(featured[active].cover_url)"
        :alt="`${featured[active].book.title}封面`"
      />
      <div v-else class="cover-placeholder">
        <span>本期推荐</span><strong>{{ featured[active].book.title }}</strong>
      </div>
    </div>
  </section>
  <section v-else class="hero-slide empty-hero">
    <div>
      <span class="eyebrow">云阅图书馆</span>
      <h2>总有一本书，正等你翻开。</h2>
      <p>从馆藏开始，发现下一本喜欢的书。</p>
      <RouterLink class="button primary" to="/books">浏览馆藏</RouterLink>
    </div>
  </section>
  <section class="section-block">
    <div class="section-title">
      <div>
        <span class="eyebrow">NEW ARRIVALS</span>
        <h2>最近上架</h2>
      </div>
      <RouterLink class="text-link" to="/books">查看全部 →</RouterLink>
    </div>
    <div v-if="latest.length" class="book-grid">
      <BookCard v-for="book in latest" :key="book.id" :book="book" />
    </div>
    <p v-else class="empty-state">还没有上架图书，稍后再来看看。</p>
  </section>
  <section class="section-block">
    <div class="section-title">
      <div>
        <span class="eyebrow">NOTICE BOARD</span>
        <h2>图书馆公告</h2>
      </div>
    </div>
    <div v-if="announcements.length" class="notice-grid">
      <article v-for="item in announcements" :key="item.id" class="announcement-card">
        <span class="eyebrow">公告</span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
      </article>
    </div>
    <p v-else class="empty-state">目前没有公告。</p>
  </section>
</template>
