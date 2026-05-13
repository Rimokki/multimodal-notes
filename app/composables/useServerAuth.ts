export function useServerAuth() {
  const authStore = useAuthStore()

  if (import.meta.server) {
    const event = useRequestEvent()
    const auth = event?.context?.auth as { user: any; sessionId: string } | undefined
    if (auth?.user) {
      authStore.hydrateFromServer(auth.user, auth.sessionId)
    }
  }
}
