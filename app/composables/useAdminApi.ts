type AdminStats = {
  totalUsers: number
  totalNotes: number
  activeUsers: number
  recentUsers: number
  dates: string[]
  userTrend: number[]
  noteTrend: number[]
}

type AdminUser = {
  id: number
  email: string
  username: string | null
  role: string
  isActive: boolean
  noteCount: number
  lastLoginAt: string | null
  createdAt: string
}

type AdminSession = {
  id: string
  userId: number
  userAgent: string | null
  ipAddress: string | null
  expiresAt: string
  revokedAt: string | null
  createdAt: string
  isExpired: boolean
  isRevoked: boolean
  user: {
    id: number
    email: string
    username: string | null
    role: string
  }
}

type AdminNote = {
  id: number
  title: string
  rawText: string | null
  excerpt: string
  isDeleted: boolean
  isFavorite: boolean
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  owner: {
    id: number
    email: string
    username: string | null
  } | null
}

type AdminLog = {
  id: number
  adminId: number
  action: string
  targetId: number | null
  detail: string | null
  ipAddress: string | null
  createdAt: string
  admin: {
    id: number
    email: string
    username: string | null
  }
}

type PaginatedResponse<T> = {
  total: number
  page: number
  pageSize: number
} & T

export function useAdminApi() {
  const { request } = useApiFetch()

  const getStats = () => request<AdminStats>('/api/admin/stats')

  const listUsers = (page = 1, pageSize = 10, keyword?: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (keyword) params.set('keyword', keyword)
    return request<PaginatedResponse<{ users: AdminUser[] }>>(`/api/admin/users?${params}`)
  }

  const updateUser = (id: number, payload: { isActive?: boolean; role?: string }) =>
    request<{ user: AdminUser }>(`/api/admin/users/${id}`, { method: 'PATCH', body: payload })

  const resetPassword = (id: number) =>
    request<{ success: boolean }>(`/api/admin/users/${id}/reset-password`, { method: 'POST' })

  const listNotes = (page = 1, pageSize = 10, keyword?: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (keyword) params.set('keyword', keyword)
    return request<PaginatedResponse<{ notes: AdminNote[] }>>(`/api/admin/notes?${params}`)
  }

  const deleteNote = (id: number) =>
    request<{ success: boolean }>(`/api/admin/notes/${id}`, { method: 'DELETE' })

  const listSessions = (page = 1, pageSize = 20) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    return request<PaginatedResponse<{ sessions: AdminSession[] }>>(`/api/admin/sessions?${params}`)
  }

  const listLogs = (page = 1, pageSize = 20, keyword?: string, action?: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (keyword) params.set('keyword', keyword)
    if (action) params.set('action', action)
    return request<PaginatedResponse<{ logs: AdminLog[] }>>(`/api/admin/operations?${params}`)
  }

  return { getStats, listUsers, updateUser, resetPassword, listNotes, deleteNote, listSessions, listLogs }
}
