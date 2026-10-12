<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import NoticeBox from '@/components/NoticeBox.vue'

const route = useRoute()
const book = ref(null)
const format = ref('')
const pdfUrl = ref('')
const epubArea = ref(null)
const error = ref('')
const loading = ref(false)
let epubBook
let rendition

function clearReader() {
  if (rendition) {
    rendition.destroy()
    rendition = null
  }
  if (epubBook) {
    epubBook.destroy()
    epubBook = null
  }
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = ''
  }
}

async function openFormat(nextFormat) {
  clearReader()
  format.value = nextFormat
  error.value = ''
  loading.value = true
  try {
    const blob = await api(`/books/${route.params.id}/files/${nextFormat}`, { asBlob: true })
    if (nextFormat === 'pdf') {
      pdfUrl.value = URL.createObjectURL(blob)
    } else {
      const { default: ePub } = await import('epubjs')
      await nextTick()
      epubBook = ePub(await blob.arrayBuffer())
      rendition = epubBook.renderTo(epubArea.value, {
        width: '100%',
        height: '100%',
        spread: 'none',
        allowScriptedContent: false,
      })
      await rendition.display()
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const [detail, loans] = await Promise.all([
      api(`/books/${route.params.id}`),
      api('/loans/mine'),
    ])
    book.value = detail
    if (!loans.some((loan) => loan.book.id === detail.id && loan.status === 'active')) {
      error.value = '借阅已结束，请重新借阅后阅读。'
      return
    }
    await openFormat(detail.formats.includes('epub') ? 'epub' : detail.formats[0])
  } catch (err) {
    error.value = err.message
  }
})
onUnmounted(clearReader)
</script>

<template>
  <div class="reader-page">
    <div class="reader-toolbar">
      <div>
        <RouterLink class="back-link" to="/loans">← 我的借阅</RouterLink>
        <h1>{{ book?.title || '在线阅读' }}</h1>
      </div>
      <div v-if="book && format" class="format-switch">
        <button
          v-for="option in book.formats"
          :key="option"
          type="button"
          :class="{ selected: format === option }"
          @click="openFormat(option)"
        >
          {{ option.toUpperCase() }}
        </button>
      </div>
    </div>
    <NoticeBox :message="error" />
    <p v-if="loading" class="empty-state">正在打开图书…</p>
    <div v-show="!loading && !error" class="reader-canvas">
      <iframe
        v-if="format === 'pdf' && pdfUrl"
        :src="pdfUrl"
        :title="`${book?.title} PDF 阅读器`"
        class="pdf-frame"
      ></iframe>
      <div v-if="format === 'epub'">
        <div ref="epubArea" class="epub-area"></div>
        <div class="reader-controls">
          <button class="button soft" @click="rendition?.prev()">← 上一页</button>
          <button class="button soft" @click="rendition?.next()">下一页 →</button>
        </div>
      </div>
    </div>
  </div>
</template>
