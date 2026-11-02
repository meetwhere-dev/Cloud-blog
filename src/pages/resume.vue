<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import resumeSource from '../../knowledge/profile/resume.md?raw'
import resumeEnglish from '../content/resume.en.md?raw'

const { t, locale } = useI18n()
const isEnglish = computed(() => locale.value === 'en')

useHead({
  title: computed(() => t('resume.title')),
  meta: [{ name: 'description', content: computed(() => t('resume.description')) }],
})

const markdown = new MarkdownIt({ html: false, linkify: false })
const source = computed(() => (isEnglish.value ? resumeEnglish : resumeSource).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''))
const sections = computed(() => source.value.split(/^## /m).slice(1).map((section, index) => {
  const newline = section.indexOf('\n')
  return { id: `section-${index}`, title: section.slice(0, newline).trim(), html: markdown.render(section.slice(newline + 1)) }
}))
const tags = ['Vue / Nuxt.js', 'React / Next.js', 'Node.js', 'Canvas', 'AI Agent']
function printResume() {
  window.print()
}
</script>

<template>
  <div class="resume-page" :lang="isEnglish ? 'en' : 'zh-CN'">
    <header class="resume-hero">
      <div class="resume-topline">
        <p class="resume-eyebrow">CLOUD WAN / RESUME</p>
        <div class="resume-language" role="group" :aria-label="t('resume.language')">
          <button type="button" :aria-pressed="!isEnglish" @click="locale = 'zh-CN'">中文</button>
          <button type="button" :aria-pressed="isEnglish" @click="locale = 'en'">English</button>
        </div>
      </div>
      <div class="resume-intro">
        <div>
          <h1>{{ t('resume.name') }}<span>{{ t('resume.role') }}</span></h1>
          <p class="resume-lead">{{ t('resume.leadFirst') }}<br>{{ t('resume.leadSecond') }}</p>
        </div>
        <div class="resume-monogram" aria-hidden="true">云<span>CODE · BUILD · ITERATE</span></div>
      </div>
      <div class="resume-hero-bottom">
        <p>{{ t('resume.city') }} <span> / </span> {{ t('resume.focus') }}</p>
        <div class="resume-actions">
          <a href="mailto:onewinfour@gmail.com">{{ t('resume.contact') }} <span aria-hidden="true">↗</span></a>
          <button type="button" @click="printResume">{{ t('resume.print') }}</button>
        </div>
      </div>
    </header>

    <div class="resume-layout">
      <aside class="resume-sidebar">
        <div class="resume-sidebar-inner">
          <p class="resume-eyebrow">{{ t('resume.onThisPage') }}</p>
          <nav :aria-label="t('resume.directory')">
            <a v-for="(section, index) in sections" :key="section.id" :href="`#${section.id}`"><span>0{{ index + 1 }}</span>{{ section.title }}</a>
          </nav>
          <div class="resume-contact">
            <p>{{ t('resume.keepInTouch') }}</p>
            <a href="mailto:onewinfour@gmail.com">onewinfour@gmail.com</a>
            <a href="tel:19138079180">19138079180</a>
          </div>
          <div class="resume-tags"><span v-for="tag in tags" :key="tag">{{ tag }}</span></div>
          <p class="resume-assistant-hint">{{ t('resume.hintFirst') }}<br>{{ t('resume.hintSecond') }}</p>
        </div>
      </aside>
      <article class="resume-body" :aria-label="t('resume.details')">
        <section v-for="(section, index) in sections" :id="section.id" :key="section.id" class="resume-section">
          <header><span>0{{ index + 1 }}</span><h2>{{ section.title }}</h2></header>
          <div class="resume-copy" v-html="section.html" />
        </section>
      </article>
    </div>
    <footer class="resume-end"><span>{{ t('resume.title') }}</span><a href="mailto:onewinfour@gmail.com">{{ t('resume.closing') }} ↗</a></footer>
  </div>
</template>

<style scoped>
.resume-page { --resume-ink: #253c38; --resume-muted: #687b74; --resume-line: #dce5df; --resume-accent: #237461; max-width: 1060px; margin: 0 auto; color: var(--resume-ink); text-align: left; }
.resume-hero { padding: 42px 48px 28px; border: 1px solid var(--resume-line); background: #f0f5ef; border-radius: 6px; }
.resume-topline { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.resume-language { display: flex; gap: 3px; border: 1px solid var(--resume-line); padding: 3px; border-radius: 5px; }
.resume-language button { font-size: 11px; padding: 5px 10px; border-radius: 3px; cursor: pointer; color: var(--resume-muted); }
.resume-language button[aria-pressed="true"] { background: var(--resume-accent); color: #fff; }
.resume-page[lang="en"] .resume-intro h1 { font-size: clamp(32px, 4vw, 48px); letter-spacing: 0; }
.resume-page[lang="en"] .resume-copy { line-height: 1.8; }
.resume-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: 2px; color: var(--resume-muted); }
.resume-intro { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin: 30px 0; }
.resume-intro h1 { font-size: 52px; font-weight: 700; letter-spacing: 3px; line-height: 1.2; }
.resume-intro h1 span { display: block; font-size: 14px; letter-spacing: 2px; font-weight: 400; margin-top: 16px; color: var(--resume-accent); }
.resume-lead { font-size: 22px; line-height: 1.65; margin-top: 28px; }
.resume-monogram { font-family: serif; font-size: 110px; color: #a6beb0; text-align: center; padding: 0 20px; }
.resume-monogram span { display: block; font-family: monospace; font-size: 9px; letter-spacing: 2px; }
.resume-hero-bottom { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; border-top: 1px solid var(--resume-line); padding-top: 22px; font-size: 12px; }
.resume-hero-bottom p { color: var(--resume-muted); }
.resume-hero-bottom p span { margin: 0 10px; opacity: .5; }
.resume-actions { display: flex; gap: 10px; }
.resume-actions a, .resume-actions button { border: 1px solid var(--resume-line); padding: 9px 16px; border-radius: 4px; cursor: pointer; }
.resume-actions a { background: var(--resume-accent); color: white; border-color: var(--resume-accent); }
.resume-actions a span { padding-left: 15px; }
.resume-layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 58px; padding: 54px 16px 0; }
.resume-sidebar-inner { position: sticky; top: 28px; }
.resume-sidebar nav { display: flex; flex-direction: column; gap: 18px; margin: 24px 0 32px; font-size: 13px; }
.resume-sidebar nav a span { color: var(--resume-muted); font-size: 10px; font-family: monospace; margin-right: 14px; }
.resume-contact { border-top: 1px solid var(--resume-line); padding-top: 22px; font-size: 12px; }
.resume-contact p { color: var(--resume-muted); margin-bottom: 10px; }
.resume-contact a { display: block; margin: 8px 0; overflow-wrap: anywhere; }
.resume-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 24px; }
.resume-tags span { border: 1px solid var(--resume-line); padding: 4px 7px; border-radius: 3px; font-size: 10px; color: var(--resume-muted); }
.resume-assistant-hint { font-size: 11px; line-height: 1.8; margin-top: 28px; color: var(--resume-muted); }
.resume-section { padding-bottom: 34px; margin-bottom: 34px; border-bottom: 1px solid var(--resume-line); scroll-margin-top: 30px; }
.resume-section > header { display: flex; gap: 15px; align-items: center; margin-bottom: 25px; }
.resume-section > header span { color: var(--resume-accent); font-family: monospace; font-size: 11px; }
.resume-section h2 { font-size: 20px; font-weight: 600; letter-spacing: 1px; }
.resume-copy { line-height: 1.95; font-size: 14px; overflow-wrap: anywhere; }
.resume-copy :deep(h3) { font-size: 17px; font-weight: 600; margin: 30px 0 5px; }
.resume-copy :deep(h3:first-child) { margin-top: 0; }
.resume-copy :deep(p) { margin: 10px 0; }
.resume-copy :deep(h3 + p) { color: var(--resume-muted); font-size: 12px; margin: 4px 0 15px; }
.resume-copy :deep(h3 + p strong) { font-weight: 400; }
.resume-copy :deep(ul) { list-style: disc; padding-left: 20px; margin: 12px 0; }
.resume-copy :deep(li) { padding-left: 3px; margin-bottom: 8px; }
.resume-copy :deep(li::marker) { color: #91afa1; }
.resume-copy :deep(a) { color: var(--resume-accent); text-decoration: underline; text-underline-offset: 4px; }
.resume-page a:hover, .resume-page button:hover { opacity: .75; }
.resume-page a:focus-visible, .resume-page button:focus-visible { outline: 2px solid var(--resume-accent); outline-offset: 5px; }
.resume-end { display: flex; justify-content: space-between; gap: 20px; font-size: 12px; color: var(--resume-muted); padding: 0 16px 20px; }
:global(.dark) .resume-page { --resume-ink: #dce6df; --resume-muted: #9bab9f; --resume-line: #35443b; --resume-accent: #7ec4a8; }
:global(.dark) .resume-hero { background: #1d2923; }
:global(.dark) .resume-monogram { color: #587768; }
:global(.dark) .resume-actions a { color: #16251e; }
@media (max-width: 760px) {
  .resume-hero { padding: 28px 24px 22px; }
  .resume-intro h1 { font-size: 40px; }
  .resume-monogram { display: none; }
  .resume-lead { font-size: 20px; }
  .resume-layout { display: block; padding: 28px 0 0; }
  .resume-sidebar-inner { position: static; }
  .resume-sidebar .resume-eyebrow, .resume-contact, .resume-tags, .resume-assistant-hint { display: none; }
  .resume-sidebar nav { flex-direction: row; flex-wrap: wrap; gap: 15px 22px; margin: 0 0 36px; }
  .resume-sidebar nav a span { display: none; }
  .resume-end { padding: 0 0 20px; }
}
@media print {
  :global(.header), :global(.blog-assistant), :global(main > footer) { display: none !important; }
  :global(html), :global(html.dark), :global(body) { background: white !important; color: black !important; }
  :global(main) { padding: 0 !important; }
  .resume-page { --resume-ink: #111 !important; --resume-muted: #555 !important; --resume-line: #ddd !important; --resume-accent: #234 !important; }
  .resume-hero { padding: 15px 0; border: 0; background: none !important; }
  .resume-intro { margin: 12px 0; }
  .resume-intro h1 { font-size: 30px; }
  .resume-lead, .resume-monogram, .resume-actions, .resume-sidebar, .resume-end, .resume-language { display: none; }
  .resume-layout { display: block; padding: 20px 0 0; }
  .resume-copy { font-size: 11px; line-height: 1.6; }
  .resume-section { padding-bottom: 15px; margin-bottom: 15px; }
  .resume-section > header { margin-bottom: 12px; break-after: avoid; }
  .resume-copy :deep(h3) { break-after: avoid; font-size: 14px; }
  .resume-copy :deep(li) { break-inside: avoid; }
}
</style>
