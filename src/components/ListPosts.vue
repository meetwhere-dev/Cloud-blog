<script setup lang="ts">
import { useRouter } from 'vue-router'
import { formatDate } from '~/logics'

const props = defineProps<{
  type?: string
  posts?: Post[]
}>()

interface Post {
  path: string
  title: string
  date: string
  translations?: { en?: { title: string; description?: string } }
  desc?: string
  platform?: string
  duration?: string
}

const router = useRouter()
const { t, locale } = useI18n()
const routes: Post[] = router.getRoutes()
  .filter(i => i.path.startsWith('/posts') && i?.meta?.frontmatter?.date)
  .sort((a, b) => +new Date(b.meta.frontmatter.date) - +new Date(a.meta.frontmatter.date))
  .filter(i => !i.path.endsWith('.html') && i.meta.frontmatter.type === props.type)
  .map(i => ({
    path: i.path,
    title: i.meta.frontmatter.title,
    date: i.meta.frontmatter.date,
    translations: i.meta.frontmatter.translations,
    duration: i.meta.frontmatter.duration,
  }))

const posts = computed(() => (props.posts || routes).map(post => ({
  ...post,
  title: locale.value === 'en' ? post.translations?.en?.title || post.title : post.title,
})))
</script>

<template>
  <ul>
    <template v-if="!posts.length">
      <div py2 op50>
        {{ t('blog.empty') }}
      </div>
    </template>
    <app-link
      v-for="route in posts" :key="route.path"
      class="item block font-normal mb-6 mt-2 no-underline"
      :to="route.path"
    >
      <li class="no-underline">
        <div class="title text-lg">
          {{ route.title }}
        </div>

        <div class="time opacity-50 text-sm -mt-1">
          {{ formatDate(route.date) }}
          <span v-if="route.duration" op80>· {{ route.duration }}</span>
          <span v-if="route.platform" op80>· {{ route.platform }}</span>
        </div>
      </li>
    </app-link>
  </ul>
</template>
