// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    authSecret: process.env.AUTH_SECRET || 'dev-only-change-me',
    authAccessTokenTtlSec: Number(process.env.AUTH_ACCESS_TOKEN_TTL_SEC || 900),
    authRefreshTokenTtlSec: Number(process.env.AUTH_REFRESH_TOKEN_TTL_SEC || 60 * 60 * 24 * 30),
    authRefreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME || 'mn_refresh_token',
    authCookieSecure: process.env.AUTH_COOKIE_SECURE === 'true',
  },
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },
  imports: {
    autoImport: true,
    dirs: ['composables'],
  },
  modules: ['@nuxt/eslint', '@element-plus/nuxt', '@pinia/nuxt'],
  css: ['./app/assets/css/main.css'],
  elementPlus: {
    defaultLocale: 'zh-cn',
    icon: 'ElIcon',
    importStyle: 'scss',
  },
  vite: {
    plugins: [tailwindcss() as any],
    optimizeDeps: {
      include: [
        'dayjs',
        'dayjs/plugin/*.js',
        'lodash-unified',
        '@element-plus/icons-vue',
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
