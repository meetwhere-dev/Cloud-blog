<script setup lang='ts'>
const router = useRouter()
const route = useRoute()
const content = ref<HTMLDivElement>()

const { t } = useI18n()

const projects = [
  {
    name: '线迹 · Vector Studio',
    link: '/vector-studio/index.html',
    descKey: 'projects.vectorStudio.description',
    date: '2026-11-02T08:00:00.000+00:00',
    icon: 'i-cib-adobe-illustrator',
  },
  {
    name: '2048 · Three.js',
    link: '/games/2048-three',
    descKey: 'projects.three2048.description',
    date: '2026-11-02T08:00:00.000+00:00',
    icon: 'i-arcticons-a2048',
  },
  {
    name: 'Somind',
    nameKey: 'projects.somind.name',
    link: 'https://www.somind.ai/',
    desc: 'Astro, SSG, I18n, S3, Cloudflare',
    date: '2026-03-24T08:00:00.000+00:00',
    icon: 'i-mdi:web',
  },
  {
    name: 'Bible',
    nameKey: 'projects.bible.name',
    link: 'https://www.themanna.app/',
    desc: 'Next.js, SSR, React, Tailwindcss, Shadcn UI, I18n, Anime.js',
    date: '2025-03-24T08:00:00.000+00:00',
    icon: 'i-mdi:web',
  },
  {
    name: 'Epub',
    nameKey: 'projects.epub.name',
    link: 'https://epub.meetlolita.com/',
    descKey: 'projects.epub.description',
    date: '2026-03-24T08:00:00.000+00:00',
    icon: 'i-material-symbols:menu-book-sharp',
  },
  {
    name: 'FaceYogi',
    nameKey: 'projects.faceYogi.name',
    link: 'https://www.faceyogi.health/',
    desc: 'Next.js, SSR, React, Tailwindcss, I18n',
    date: '2024-04-24T08:00:00.000+00:00',
    icon: 'i-mdi:web',
  },
  {
    name: 'Femometer',
    nameKey: 'projects.femometer.name',
    link: 'https://www.femometer.com/',
    desc: 'Nuxt.js SSR, Vue, Vite, Unocss, I18n, Anime.js, AI-Assistant',
    date: '2023-03-24T08:00:00.000+00:00',
    icon: 'i-mdi:web',
  },
  {
    name: 'wechatAnnualReport2024',
    nameKey: 'projects.wechatAnnualReport.name',
    link: 'https://s.femometer.com/upload/annual_report_generator/report.html?path=https://s.femometer.com/upload/annual_report/1734485400123.json',
    descKey: 'projects.wechatAnnualReport.description',
    date: '2024-12-25T08:00:00.000+00:00',
    icon: 'i-carbon:report',
  }, {
    name: '2048',
    link: '/2048/index.html',
    descKey: 'projects.original2048.description',
    date: '2019-06-22T08:00:00.000+00:00',
    icon: 'i-arcticons-a2048',
  }, {
    name: '花火 · Fireworks Studio',
    link: '/firework/index.html',
    descKey: 'projects.fireworksStudio.description',
    icon: 'i-emojione-monotone-fireworks',
  }, {
    name: 'illustrator-demo',
    link: '/illustrator-demo/index.html',
    descKey: 'projects.illustratorDemo.description',
    icon: 'i-cib-adobe-illustrator',
  }, {
    name: 'faceDetect',
    link: '/faceDetect/index.html',
    descKey: 'projects.faceDetect.description',
    icon: 'i-iconoir-face-id',
  }]

onMounted(() => {
  const navigate = () => {
    if (location.hash) {
      document.querySelector(decodeURIComponent(location.hash))
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
      if (hash && (!pathname || pathname === location.pathname)) {
        window.history.replaceState({}, '', hash)
        navigate()
      }
      else {
        router.push({ path: pathname, hash })
      }
    }
  }

  useEventListener(window, 'hashchange', navigate)
  useEventListener(content.value!, 'click', handleAnchors, { passive: false })

  navigate()
  setTimeout(navigate, 500)
})
</script>

<template>
  <div class="prose m-auto my-8 text-left">
    <h1 class="mb-0 text-left">
      {{ t('title.projects') }}
    </h1>
  </div>
  <article ref="content">
    <ul class="prose m-auto mt-8 mb-8 text-left">
      <a
        v-for="item in projects" :key="item.name"
        class="item group block -mx-3 mb-6 mt-2 rounded-lg font-normal no-underline transition-all duration-200 hover:-translate-y-1"
        :href="item.link"
        target="_blank"
      >
        <li class="no-underline flex">
          <div class="flex-none text-5xl opacity-50 transition-all duration-200 group-hover:scale-110 group-hover:opacity-80" :class="item.icon || 'i-carbon-unknown'" />
          <div class="min-w-0 flex flex-col justify-center mx-5">
            <div class="text-5 transition-colors duration-200 group-hover:text-primary">{{ item.nameKey ? t(item.nameKey) : item.name }}</div>
            <div class="desc text-sm opacity-50 font-normal transition-opacity duration-200 group-hover:opacity-70">{{ item.descKey ? t(item.descKey) : item.desc }}</div>
          </div>
        </li>
      </a>
    </ul>
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

