let refreshPromise: Promise<boolean> | null = null

const PROACTIVE_REFRESH_BUFFER_MS = 30_000

export function useApiFetch() {
  const authStore = useAuthStore()

  const buildAuthHeader = () => {
    const token = authStore.accessToken
    return token ? `Bearer ${token}` : undefined
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          await authStore.refreshSession()
          return true
        } catch {
          authStore.clearSession()
          return false
        } finally {
          refreshPromise = null
        }
      })()
    }
    return refreshPromise
  }

  const shouldSkipInterceptor = (url: string) => {
    const skipPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/logout']
    return skipPaths.some((p) => url.startsWith(p))
  }

  const isTokenNearExpiry = () => {
    const expiresAt = authStore.accessTokenExpiresAt
    if (!expiresAt) return false
    return Date.now() >= expiresAt - PROACTIVE_REFRESH_BUFFER_MS
  }

  const ensureFreshToken = async () => {
    if (!authStore.accessToken || !isTokenNearExpiry()) return
    await refreshAccessToken()
  }

  const request = async <T = any>(url: string, options: Record<string, any> = {}): Promise<T> => {
    if (!shouldSkipInterceptor(url)) {
      await ensureFreshToken()
    }

    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    }

    const authHeader = buildAuthHeader()
    if (authHeader) {
      headers.Authorization = authHeader
    }

    const fetchOpts = { ...options, headers }
    const doFetch = $fetch as (url: string, opts: Record<string, any>) => Promise<any>

    try {
      return await doFetch(url, fetchOpts) as T
    } catch (error: any) {
      const statusCode = error?.response?.status ?? error?.status ?? error?.data?.statusCode

      if (statusCode !== 401 || shouldSkipInterceptor(url)) {
        throw error
      }

      const refreshed = await refreshAccessToken()
      if (!refreshed) {
        throw error
      }

      const newAuthHeader = buildAuthHeader()
      if (newAuthHeader) {
        headers.Authorization = newAuthHeader
      }

      return await doFetch(url, { ...options, headers }) as T
    }
  }

  return { request }
}
