export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  const { getUnreadCount, markAsRead, markAllAsRead } = useNotificationApi()

  const fetchUnreadCount = async () => {
    try {
      const { count } = await getUnreadCount()
      unreadCount.value = count
    } catch {
      // silently fail - non-critical
    }
  }

  const markNotificationAsRead = async (id: number) => {
    await markAsRead(id)
    if (unreadCount.value > 0) unreadCount.value--
  }

  const markAllNotificationsAsRead = async () => {
    await markAllAsRead()
    unreadCount.value = 0
  }

  const reset = () => {
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, markNotificationAsRead, markAllNotificationsAsRead, reset }
})
