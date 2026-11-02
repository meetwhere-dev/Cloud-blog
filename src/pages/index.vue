<script setup lang="ts">
const { t, locale } = useI18n()

useHead({
  title: computed(() => t('home.title')),
})
</script>

<template>
  <div :lang="locale">
    <Post :frontmatter="{ title: t('home.title') }">
      <div class="prose prose-sm m-auto text-left">
        <p>{{ t('home.introduction') }}</p>
        <p>{{ t('home.work') }}</p>
        <p>{{ t('home.interests') }}</p>
        <p>
          <RouterLink to="/resume">
            {{ t('home.resume') }}
          </RouterLink>
        </p>
        <hr>
        <p>
          {{ t('home.elsewhere') }}
          <a href="https://github.com/meetwhere-dev" target="_blank" rel="noopener">GitHub</a>
          ·
          <a href="https://space.bilibili.com/3830005" target="_blank" rel="noopener">{{ t('home.bilibili') }}</a>
        </p>
      </div>
    </Post>
  </div>
</template>
