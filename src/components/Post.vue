<script setup lang='ts'>
import dayjs from 'dayjs'
import type { Component } from 'vue'

const props = defineProps({
  frontmatter: {
    type: Object,
    required: true,
  },
})

function formatDate(d: string | Date) {
  const date = dayjs(d)
  if (date.year() === dayjs().year())
    return date.format('MMM D')
  return date.format('MMM D, YYYY')
}

const router = useRouter()
const route = useRoute()
const content = ref<HTMLDivElement>()
const { t, locale } = useI18n()
const translations = import.meta.globEager('../content/posts/en/*.md') as Record<string, {
  default: Component
  title: string
  description?: string
}>
const translation = computed(() => translations[`../content/posts/en/${route.path.replace(/\/$/, '').split('/').pop()}.md`])
const isBlog = computed(() => route.path.startsWith('/posts/') && !!props.frontmatter.date)
const isEnglish = computed(() => locale.value === 'en')
const frontmatter = computed(() => isBlog.value && isEnglish.value && translation.value
  ? { ...props.frontmatter, title: translation.value.title, description: translation.value.description }
  : props.frontmatter)

// Blog metadata is owned here so the original Markdown cannot overwrite the active language.
useHead(computed(() => isBlog.value
  ? {
      title: frontmatter.value.title,
      meta: [{ name: 'description', content: frontmatter.value.description || '' }],
    }
  : {}))

watch(locale, async () => {
  if (!isBlog.value)
    return
  if (route.hash)
    await router.replace({ path: route.path, query: route.query, hash: '' })
  await nextTick()
  window.scrollTo({ top: 0, behavior: 'auto' })
})

onMounted(() => {
  const navigate = () => {
    if (location.hash) {
      document.getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleAnchors = (
    event: MouseEvent & { target: HTMLElement },
  ) => {
    const link = event.target.closest('a')

    if (
      !event.defaultPrevented
      && link
      && event.button === 0
      && link.target !== '_blank'
      && link.rel !== 'external'
      && !link.download
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
    ) {
      const url = new URL(link.href)
      if (url.origin !== window.location.origin)
        return

      event.preventDefault()
      const { pathname, hash } = url
      if (hash && (!pathname || pathname === location.pathname))
        router.replace({ path: route.path, query: route.query, hash }).then(navigate)

      else
        router.push({ path: pathname, hash })
    }
  }

  useEventListener(window, 'hashchange', navigate)
  useEventListener(content.value!, 'click', handleAnchors, { passive: false })

  navigate()
  setTimeout(navigate, 500)
})
</script>

<template>
  <div v-if="frontmatter.display ?? frontmatter.title" :lang="isBlog ? (isEnglish ? 'en' : 'zh-CN') : undefined" class="prose m-auto my-8 text-left">
    <div v-if="isBlog" class="post-language" role="group" :aria-label="t('blog.language')">
      <button type="button" :aria-pressed="!isEnglish" @click="locale = 'zh-CN'">
        中文
      </button>
      <button type="button" :aria-pressed="isEnglish" @click="locale = 'en'">
        English
      </button>
    </div>
    <h1 class="mb-0 text-left">
      {{ frontmatter.display ? t(frontmatter.display) : frontmatter.title }}
    </h1>
    <p v-if="frontmatter.date" class="opacity-50 !-mt-2">
      {{ formatDate(frontmatter.date) }} <span v-if="frontmatter.duration">· {{ frontmatter.duration }}</span>
    </p>
    <p v-if="isBlog && frontmatter.description" class="opacity-70">
      {{ frontmatter.description }}
    </p>
    <p v-if="frontmatter.subtitle" class="opacity-50 !-mt-6 italic">
      {{ frontmatter.subtitle }}
    </p>
  </div>
  <article ref="content" :lang="isBlog ? (isEnglish ? 'en' : 'zh-CN') : undefined">
    <component :is="translation.default" v-if="isBlog && isEnglish && translation" />
    <slot v-else />
  </article>
  <div v-if="route.path !== '/'" class="prose m-auto mt-8 mb-8 text-left">
    <router-link
      :to="route.path.split('/').slice(0, -1).join('/') || '/'"
      class="font-mono no-underline opacity-50 hover:opacity-75"
    >
      cd ..
    </router-link>
  </div>
</template>

<style scoped>
.post-language { display: flex; width: fit-content; gap: 4px; border: 1px solid currentColor; border-radius: 6px; padding: 3px; margin-bottom: 1.5rem; }
.post-language button { padding: 4px 12px; border-radius: 3px; font-size: 14px; cursor: pointer; }
.post-language button[aria-pressed="true"] { background: #0d9488; color: white; }
.post-language button:focus-visible { outline: 2px solid #0d9488; outline-offset: 3px; }
</style>
