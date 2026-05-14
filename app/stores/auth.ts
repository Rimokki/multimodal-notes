type AuthUser = {
  id: number
  email: string
  username: string | null
  avatarUrl: string | null
  isActive: boolean
  role: string
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

type AuthSessionPayload = {
  user: AuthUser
  accessToken: string
  accessTokenExpiresInSec?: number
}

type AuthStorage = {
  user: AuthUser | null
  accessToken: string | null
  accessTokenExpiresAt: number | null
}

const AUTH_STORAGE_KEY = 'mn.auth.session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)
  const accessTokenExpiresAt = ref<number | null>(null)
  const hydrated = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value && accessToken.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const accountName = computed(() => {
    return user.value?.username || ''
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const authHeader = computed(() => {
    if (!accessToken.value) return null
    return `Bearer ${accessToken.value}`
  })

  const persist = () => {
    if (!import.meta.client) return
    const payload: AuthStorage = {
      user: user.value,
      accessToken: accessToken.value,
      accessTokenExpiresAt: accessTokenExpiresAt.value,
    }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload))
  }

  const clearPersisted = () => {
    if (!import.meta.client) return
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return

    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (!raw) {
        hydrated.value = true
        return
      }

      const parsed = JSON.parse(raw) as AuthStorage
      user.value = parsed.user ?? null
      accessToken.value = parsed.accessToken ?? null
      accessTokenExpiresAt.value = parsed.accessTokenExpiresAt ?? null
    } catch {
      clearPersisted()
      user.value = null
      accessToken.value = null
      accessTokenExpiresAt.value = null
    } finally {
      hydrated.value = true
    }
  }

  const setSession = (payload: AuthSessionPayload) => {
    user.value = payload.user
    accessToken.value = payload.accessToken
    accessTokenExpiresAt.value = payload.accessTokenExpiresInSec
      ? Date.now() + payload.accessTokenExpiresInSec * 1000
      : null
    persist()
  }

  const clearSession = () => {
    user.value = null
    accessToken.value = null
    accessTokenExpiresAt.value = null
    clearPersisted()
  }

  const fetchMe = async () => {
    if (!accessToken.value) {
      clearSession()
      return
    }

    const { request } = useApiFetch()
    const response = await request<{ user: AuthUser }>('/api/auth/me')

    user.value = response.user
    persist()
  }

  const refreshSession = async () => {
    const response = await $fetch<AuthSessionPayload>('/api/auth/refresh', {
      method: 'POST',
    })
    setSession(response)
  }

  const initialize = async () => {
    hydrate()
    if (!accessToken.value) return

    // 已从 localStorage 恢复完整会话，跳过网络请求
    if (user.value) return

    try {
      await fetchMe()
    } catch {
      clearSession()
    }
  }

  return {
    user,
    accessToken,
    accessTokenExpiresAt,
    hydrated,
    isLoggedIn,
    isAdmin,
    accountName,
    setSession,
    clearSession,
    refreshSession,
    hydrate,
    initialize,
  }
})
