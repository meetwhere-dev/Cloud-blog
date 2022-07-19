<script setup lang="ts">
const { t, availableLocales, locale } = useI18n()

const toggleLocales = () => {
  // change to some real logic
  const locales = availableLocales
  locale.value = locales[(locales.indexOf(locale.value) + 1) % locales.length]
}
</script>

<template>
  <header class="header flex items-center h-20 px-20 z-40 text-5">
    <router-link
      class="w-10 h-10 select-none outline-none"
      to="/"
      focusable="false"
    >
      <img src="/logo.ico" alt="logo">
    </router-link>
    <nav class="nav">
      <div class="spacer" />
      <div class="right">
        <router-link to="/posts" title="Blog">
          <span class="lt-md:hidden">{{ t('title.blogs') }}</span>
          <div i-ri-article-line md:hidden />
        </router-link>
        <router-link to="/projects" title="Projects">
          <span class="lt-md:hidden">{{ t('title.projects') }}</span>
          <div i-ri-lightbulb-line class="md:hidden" />
        </router-link>
        <a href="https://github.com/meetwhere-dev" target="_blank" title="GitHub" class="lt-md:hidden">
          <div i-carbon-logo-github />
        </a>

        <a class="icon-btn mx-2 !outline-none" :title="t('button.toggle_dark')" @click="toggleDark()">
          <div i="carbon-sun dark:carbon-moon" />
        </a>

        <a class="icon-btn mx-2" :title="t('button.toggle_langs')" @click="toggleLocales()">
          <div i-carbon-language />
        </a>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  width: 100%;
  display: grid;
  grid-template-columns: auto max-content;
  box-sizing: border-box;
}

/* .nav > * {
  margin: auto;
} */

.nav img {
  margin-bottom: 0;
}

.nav a {
  cursor: pointer;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  opacity: 0.6;
  outline: none;
}

.nav a:hover {
  opacity: 1;
  text-decoration-color: inherit;
}

.nav .right {
  display: grid;
  grid-gap: 1.2rem;
  grid-auto-flow: column;
}

.nav .right > * {
  margin: auto;
}
</style>
