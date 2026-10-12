<script setup>
import { theme } from '@/lib/theme'
</script>

<template>
  <div class="theme-switch" role="group" aria-label="页面主题">
    <button
      type="button"
      :class="{ active: theme === 'light' }"
      :aria-pressed="theme === 'light'"
      aria-label="浅色模式"
      title="浅色模式"
      @click="theme = 'light'"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path
          d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
        />
      </svg>
    </button>
    <button
      type="button"
      :class="{ active: theme === 'dark' }"
      :aria-pressed="theme === 'dark'"
      aria-label="深色模式"
      title="深色模式"
      @click="theme = 'dark'"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20.6 14.1A8.7 8.7 0 0 1 9.9 3.4 8.8 8.8 0 1 0 20.6 14.1Z" />
      </svg>
    </button>
  </div>
</template>
