type NotificationItem = {
  id: number
  type: 'BROADCAST' | 'TARGETED'
  title: string
  content: string
  isRead: boolean
  createdAt: string
  sender: { id: number; username: string | null; email: string } | null
}

type NotificationListResponse = {
  notifications: NotificationItem[]
  total: number
  page: number
  pageSize: number
}

export function useNotificationApi() {
  const { request } = useApiFetch()

  const listNotifications = (filter: 'all' | 'read' | 'unread' = 'all', page = 1, pageSize = 20) => {
    const params = new URLSearchParams()
    params.set('filter', filter)
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return request<NotificationListResponse>(`/api/notifications?${params}`)
  }

  const getUnreadCount = () =>
    request<{ count: number }>('/api/notifications/unread-count')

  const markAsRead = (id: number) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' })

  const markAllAsRead = () =>
    request<{ success: boolean; count: number }>('/api/notifications/read-all', { method: 'POST' })

  const createBroadcast = (title: string, content: string) =>
    request<{ notification: NotificationItem }>('/api/admin/notifications', {
      method: 'POST',
      body: { title, content },
    })

  const listAllNotifications = (page = 1, pageSize = 20) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return request<NotificationListResponse>(`/api/admin/notifications?${params}`)
  }

  const deleteNotification = (id: number) =>
    request<{ success: boolean }>(`/api/admin/notifications/${id}`, { method: 'DELETE' })

  return { listNotifications, getUnreadCount, markAsRead, markAllAsRead, createBroadcast, listAllNotifications, deleteNotification }
}
