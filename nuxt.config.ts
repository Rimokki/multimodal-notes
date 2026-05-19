import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

const fileStorageMount =
  process.env.FILE_STORAGE_MOUNT || resolve(process.cwd(), 'server/userFiles')

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  devtools: { enabled: true },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET || 'dev-only-change-me',
    authAccessTokenTtlSec: Number(process.env.AUTH_ACCESS_TOKEN_TTL_SEC || 900),
    authRefreshTokenTtlSec: Number(process.env.AUTH_REFRESH_TOKEN_TTL_SEC || 60 * 60 * 24 * 30),
    authRefreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'mn_refresh_token',
    authCookieSecure: process.env.AUTH_COOKIE_SECURE === 'true',
  },
  imports: {
    autoImport: true,
    dirs: ['composables'],
  },
  modules: ['@nuxt/eslint', '@element-plus/nuxt', '@pinia/nuxt', 'nuxt-file-storage'],
  fileStorage: {
    mount: fileStorageMount,
  },
  css: ['./app/assets/css/main.css'],
  elementPlus: {
    defaultLocale: 'zh-cn',
    icon: 'ElIcon',
    importStyle: 'scss',
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        'vue',
        'dayjs',
        'dayjs/plugin/*',
        'lodash-unified',
        'lucide-vue-next',
        '@tiptap/vue-3',
        '@tiptap/extensions',
        '@tiptap/starter-kit',
        '@tiptap/extension-link',
        '@tiptap/extension-image',
        '@tiptap/extension-text-align',
        '@tiptap/extension-superscript',
        '@tiptap/extension-subscript',
        '@tiptap/extension-highlight',
        '@tiptap/extension-heading',
        '@tiptap/extension-table-of-contents',
        '@tiptap/pm/state',
        '@tiptap/extension-audio',
        '@tiptap/extension-horizontal-rule',
        'tesseract.js', // CJS
        '@tiptap/extension-details',
        '@tiptap/extension-list',
        '@tiptap/extension-text-style',
        '@tiptap/extension-drag-handle-vue-3',
        '@tiptap/extension-table',
        '@tiptap/extension-table',
        '@tiptap/markdown',
        'jszip', // CJS
        '@tiptap/vue-3/menus',
        'd3',
        'uuid',
        'echarts',
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/css/element-variables.scss" as *;`,
        },
      },
    },
  },
})
