export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  await authStore.initialize()

  if (to.path.startsWith('/admin')) {
    if (!authStore.isLoggedIn || !authStore.isAdmin) {
      return navigateTo('/')
    }
    return
  }

  if (authStore.isAdmin && to.path !== '/personal') {
    return navigateTo('/admin')
  }
})
