export default defineNuxtRouteMiddleware(async (to) => {
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
