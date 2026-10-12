<script setup>
defineProps({ message: { type: String, default: '' }, kind: { type: String, default: 'error' } })
</script>

<template>
  <p v-if="message" class="notice" :class="kind" role="status">{{ message }}</p>
</template>
