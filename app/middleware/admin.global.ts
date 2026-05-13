export default defineNuxtRouteMiddleware(async (to) => {
  // SSR 期间跳过路由重定向，避免基于服务端认证状态做出错误的跳转决策。
  // 客户端 hydration 后会重新执行该中间件，确保正确的路由保护。
  if (!import.meta.client) return

  const authStore = useAuthStore()

  // 确保 auth 状态已初始化（地址栏直接输入 URL 时 store 可能尚未就绪）
  await authStore.initialize()

  // 非管理员访问管理页面 → 跳转首页
  if (to.path.startsWith('/admin')) {
    if (!authStore.isLoggedIn || !authStore.isAdmin) {
      return navigateTo('/')
    }
    return
  }

  // 管理员访问普通用户页面 → 跳转管理总览（个人中心除外）
  if (authStore.isAdmin && to.path !== '/personal') {
    return navigateTo('/admin')
  }
})
