<script setup lang="ts">
const { t } = useI18n()
useHead({
  title: computed(() => `404 · ${t('not-found')} · Cloud Blog`),
  meta: [{ name: 'robots', content: 'noindex' }],
})
</script>

<template>
  <section class="prose m-auto text-left">
    <p class="text-sm opacity-60">
      404 · Cloud Blog
    </p>
    <h1>{{ t('not-found') }}</h1>
    <p>{{ t('not-found-description') }}</p>
    <RouterLink to="/">
      {{ t('button.home') }} →
    </RouterLink>
  </section>
</template>
