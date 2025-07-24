<script setup lang='ts'>
const router = useRouter()
const route = useRoute()
const content = ref<HTMLDivElement>()

const { t } = useI18n()

const projects = [{
  name: 'Wechat Annual Report 2024',
  link: 'https://s.femometer.com/upload/annual_report_generator/report.html?path=https://s.femometer.com/upload/annual_report/1734485400123.json',
  desc: '微信年报2024.',
  date: '2024-12-07T08:00:00.000+00:00',
  icon: 'i-carbon:report',
}, {
  name: '2048',
  link: '/2048/index.html',
  desc: '小游戏2048.',
  date: '2019-06-22T08:00:00.000+00:00',
  icon: 'i-arcticons-a2048',
}, {
  name: 'Firework',
  link: '/firework/index.html',
  desc: '烟花.',
  icon: 'i-emojione-monotone-fireworks',
}, {
  name: 'illustrator-demo',
  link: '/illustrator-demo/index.html',
  desc: '矢量绘图.',
  icon: 'i-cib-adobe-illustrator',
}, {
  name: 'faceDetect',
  link: '/faceDetect/index.html',
  desc: '人脸识别.',
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
        class="item block font-normal mb-6 mt-2 no-underline"
        :href="item.link"
        target="_blank"
      >
        <li class="no-underline flex">

          <div class="text-5xl opacity-50" :class="item.icon || 'i-carbon-unknown'" />
          <div class="flex flex-col justify-center mx-5">
            <div class="text-5">{{ item.name }}</div>
            <div class="desc text-sm opacity-50 font-normal" v-html="item.desc" />
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

