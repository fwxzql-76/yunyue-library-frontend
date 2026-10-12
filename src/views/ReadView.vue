<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/lib/api'
import { theme } from '@/lib/theme'

const route = useRoute()
const book = ref(null)
const format = ref('')
const error = ref('')
const loading = ref(false)
const tocOpen = ref(false)
const toc = ref([])
const currentHref = ref('')
const pdfUrl = ref('')
const pdfPage = ref(1)
const pdfPages = ref(0)
const epubArea = ref(null)
const fontSize = ref(Number(localStorage.getItem('yunyue_reader_font')) || 100)
const pdfZoom = ref(Number(localStorage.getItem('yunyue_pdf_zoom')) || 100)
let epubBook
let rendition
let pdfTask
let pdfDocument
let requestId = 0

fontSize.value = Math.min(160, Math.max(80, fontSize.value))
pdfZoom.value = Math.min(175, Math.max(75, pdfZoom.value))

const pdfSrc = computed(() =>
  pdfUrl.value ? `${pdfUrl.value}#page=${pdfPage.value}&zoom=${pdfZoom.value}` : '',
)
const currentChapter = computed(() => {
  if (format.value === 'pdf')
    return pdfPages.value ? `第 ${pdfPage.value} / ${pdfPages.value} 页` : ''
  return (
    [...toc.value].reverse().find((item) => currentHref.value.includes(item.href.split('#')[0]))
      ?.label || 'EPUB 阅读'
  )
})

function releaseReader() {
  if (rendition) {
    rendition.destroy()
    rendition = null
  }
  if (epubBook) {
    epubBook.destroy()
    epubBook = null
  }
  if (pdfTask) {
    pdfTask.destroy()
    pdfTask = null
    pdfDocument = null
  }
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = ''
  }
  toc.value = []
  currentHref.value = ''
  pdfPage.value = 1
  pdfPages.value = 0
  tocOpen.value = false
}

function flattenEpub(items, depth = 0) {
  return items.flatMap((item) => [
    { id: item.id || item.href, label: item.label?.trim() || '未命名章节', href: item.href, depth },
    ...flattenEpub(item.subitems || [], depth + 1),
  ])
}

async function flattenPdf(items, depth = 0) {
  const result = []
  for (const item of items) {
    const destination =
      typeof item.dest === 'string' ? await pdfDocument.getDestination(item.dest) : item.dest
    let page = null
    if (destination?.[0] !== undefined) {
      page =
        typeof destination[0] === 'number'
          ? destination[0] + 1
          : (await pdfDocument.getPageIndex(destination[0])) + 1
    }
    if (page)
      result.push({
        id: `${depth}-${result.length}-${item.title}`,
        label: item.title || '未命名章节',
        page,
        depth,
      })
    if (item.items?.length) result.push(...(await flattenPdf(item.items, depth + 1)))
  }
  return result
}

function applyEpubTheme() {
  if (!rendition) return
  rendition.themes.select(theme.value)
  rendition.themes.override('background-color', theme.value === 'dark' ? '#17251f' : '#fff', true)
  rendition.themes.override('color', theme.value === 'dark' ? '#e8f1e9' : '#243b36', true)
}

async function openFormat(nextFormat) {
  if (loading.value) return
  const currentRequest = ++requestId
  releaseReader()
  format.value = nextFormat
  error.value = ''
  loading.value = true
  try {
    const blob = await api(`/books/${route.params.id}/files/${nextFormat}`, { asBlob: true })
    if (currentRequest !== requestId) return
    if (nextFormat === 'pdf') {
      pdfUrl.value = URL.createObjectURL(blob)
      const pdfjs = await import('pdfjs-dist')
      if (currentRequest !== requestId) return
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()
      pdfTask = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) })
      pdfDocument = await pdfTask.promise
      if (currentRequest !== requestId) return
      pdfPages.value = pdfDocument.numPages
      const outline = await pdfDocument.getOutline()
      toc.value = outline ? await flattenPdf(outline) : []
    } else {
      const { default: ePub } = await import('epubjs')
      await nextTick()
      if (currentRequest !== requestId) return
      epubBook = ePub(await blob.arrayBuffer())
      rendition = epubBook.renderTo(epubArea.value, {
        width: '100%',
        height: '100%',
        spread: 'none',
        allowScriptedContent: false,
      })
      rendition.themes.register('light', { body: { 'background-color': '#fff', color: '#243b36' } })
      rendition.themes.register('dark', {
        body: { 'background-color': '#17251f', color: '#e8f1e9' },
        'p, h1, h2, h3, h4, h5, h6, li': { color: '#e8f1e9' },
        a: { color: '#91d6ac' },
      })
      applyEpubTheme()
      rendition.themes.fontSize(`${fontSize.value}%`)
      rendition.on('relocated', (location) => {
        currentHref.value = location.start.href
      })
      await rendition.display()
      const navigation = await epubBook.loaded.navigation
      toc.value = flattenEpub(navigation.toc || [])
      if (!toc.value.length) {
        toc.value = epubBook.spine.spineItems.map((item, index) => ({
          id: item.idref || index,
          label: `第 ${index + 1} 章`,
          href: item.href,
          depth: 0,
        }))
      }
    }
  } catch (err) {
    if (currentRequest === requestId) error.value = err.message || '图书打开失败'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

async function loadBook() {
  const currentRequest = ++requestId
  releaseReader()
  book.value = null
  format.value = ''
  error.value = ''
  loading.value = true
  try {
    const [detail, loans] = await Promise.all([
      api(`/books/${route.params.id}`),
      api('/loans/mine'),
    ])
    if (currentRequest !== requestId) return
    book.value = detail
    if (!loans.some((loan) => loan.book.id === detail.id && loan.status === 'active')) {
      error.value = '借阅已结束，请重新借阅后阅读。'
      return
    }
    if (!detail.formats.length) {
      error.value = '这本书暂时没有可阅读的文件。'
      return
    }
    loading.value = false
    await openFormat(detail.formats.includes('epub') ? 'epub' : detail.formats[0])
  } catch (err) {
    if (currentRequest === requestId) error.value = err.message
  } finally {
    if (currentRequest === requestId && !format.value) loading.value = false
  }
}

function goTo(item) {
  if (format.value === 'pdf') pdfPage.value = item.page
  else rendition?.display(item.href)
  tocOpen.value = false
}
function turnPage(direction) {
  if (format.value === 'pdf')
    pdfPage.value = Math.min(pdfPages.value, Math.max(1, pdfPage.value + direction))
  else if (direction > 0) rendition?.next()
  else rendition?.prev()
}
function changeSize(direction) {
  if (format.value === 'pdf') {
    pdfZoom.value = Math.min(175, Math.max(75, pdfZoom.value + direction * 10))
    localStorage.setItem('yunyue_pdf_zoom', String(pdfZoom.value))
  } else {
    fontSize.value = Math.min(160, Math.max(80, fontSize.value + direction * 10))
    rendition?.themes.fontSize(`${fontSize.value}%`)
    localStorage.setItem('yunyue_reader_font', String(fontSize.value))
  }
}
function onKeydown(event) {
  if (
    event.target instanceof HTMLElement &&
    event.target.closest('input, textarea, select, button')
  )
    return
  if (event.key === 'Escape') tocOpen.value = false
  if (event.key === 'ArrowLeft') turnPage(-1)
  if (event.key === 'ArrowRight') turnPage(1)
}

watch(theme, applyEpubTheme)
watch(() => route.params.id, loadBook, { immediate: true })
onUnmounted(() => {
  ++requestId
  releaseReader()
})
</script>

<template>
  <div class="reader-page" @keydown="onKeydown">
    <div class="reader-toolbar">
      <div class="reader-title">
        <RouterLink class="back-link" to="/loans">← 我的借阅</RouterLink>
        <div>
          <h1>{{ book?.title || '在线阅读' }}</h1>
          <small>{{ currentChapter }}</small>
        </div>
      </div>
      <div v-if="book && format" class="reader-tools">
        <button
          type="button"
          class="reader-tool-button"
          :aria-expanded="tocOpen"
          @click="tocOpen = !tocOpen"
        >
          ☰ <span>目录</span>
        </button>
        <div class="reader-size-control" :aria-label="format === 'pdf' ? '页面缩放' : '字号大小'">
          <button
            type="button"
            :disabled="(format === 'pdf' ? pdfZoom : fontSize) <= (format === 'pdf' ? 75 : 80)"
            :aria-label="format === 'pdf' ? '缩小页面' : '缩小字号'"
            @click="changeSize(-1)"
          >
            A−
          </button>
          <span
            >{{ format === 'pdf' ? '缩放' : '字号' }}
            {{ format === 'pdf' ? pdfZoom : fontSize }}%</span
          >
          <button
            type="button"
            :disabled="(format === 'pdf' ? pdfZoom : fontSize) >= (format === 'pdf' ? 175 : 160)"
            :aria-label="format === 'pdf' ? '放大页面' : '放大字号'"
            @click="changeSize(1)"
          >
            A+
          </button>
        </div>
        <div class="format-switch" aria-label="文件格式">
          <button
            v-for="option in book.formats"
            :key="option"
            type="button"
            :disabled="loading"
            :class="{ selected: format === option }"
            @click="openFormat(option)"
          >
            {{ option.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>
    <div class="reader-stage">
      <p v-if="loading" class="reader-state">正在打开图书…</p>
      <p v-else-if="error" class="reader-state">{{ error }}</p>
      <div v-if="format && !error" class="reader-canvas">
        <iframe
          v-if="format === 'pdf' && pdfUrl"
          :key="pdfSrc"
          :src="pdfSrc"
          :title="`${book?.title} PDF 阅读器`"
          class="pdf-frame"
        ></iframe>
        <div v-if="format === 'epub'" ref="epubArea" class="epub-area"></div>
      </div>
      <aside v-if="tocOpen && !loading && !error" class="reader-toc" aria-label="章节目录">
        <div class="reader-toc-heading">
          <strong>目录</strong
          ><button type="button" aria-label="关闭目录" @click="tocOpen = false">×</button>
        </div>
        <p v-if="!toc.length" class="reader-toc-empty">这份文件没有提供章节目录。</p>
        <button
          v-for="item in toc"
          :key="item.id"
          type="button"
          class="reader-toc-item"
          :class="{
            active:
              format === 'pdf'
                ? pdfPage === item.page
                : currentHref.includes(item.href.split('#')[0]),
          }"
          :style="{ paddingLeft: `${16 + item.depth * 16}px` }"
          @click="goTo(item)"
        >
          <span>{{ item.label }}</span
          ><small v-if="format === 'pdf'">{{ item.page }}</small>
        </button>
      </aside>
    </div>
    <div v-if="book && format && !error" class="reader-bottom-bar">
      <button
        type="button"
        class="reader-page-button"
        :disabled="loading || (format === 'pdf' && pdfPage <= 1)"
        @click="turnPage(-1)"
      >
        ← 上一页
      </button>
      <span>{{ currentChapter }}</span>
      <button
        type="button"
        class="reader-page-button"
        :disabled="loading || (format === 'pdf' && pdfPage >= pdfPages)"
        @click="turnPage(1)"
      >
        下一页 →
      </button>
    </div>
  </div>
</template>
