export type NoteItem = {
  id: number
  userId: number | null
  title: string
  content: string
  rawText: string | null
  isFavorite: boolean
  isDeleted: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

type NotesMode = 'all' | 'favorite' | 'deleted'

type ListNotesResponse = {
  notes: NoteItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

function useAuthHeaderOrThrow() {
  const authStore = useAuthStore()
  const authHeader = authStore.accessToken ? `Bearer ${authStore.accessToken}` : null

  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: '请先登录后再操作笔记',
    })
  }

  return authHeader
}

export function useNotesApi() {
  const listNotes = async (mode: NotesMode, keyword = '', page = 1, pageSize = 5) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<ListNotesResponse>('/api/notes', {
      method: 'GET',
      query: {
        mode,
        q: keyword || undefined,
        page,
        pageSize,
      },
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const createNote = async (payload?: { title?: string; content?: string }) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>('/api/notes', {
      method: 'POST',
      body: payload,
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const getNote = async (id: number) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>(`/api/notes/${id}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const updateNote = async (id: number, payload: { title?: string; content?: string }) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: payload,
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const toggleFavorite = async (id: number, isFavorite?: boolean) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>(`/api/notes/${id}/favorite`, {
      method: 'POST',
      body: {
        isFavorite,
      },
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const moveToRecycle = async (id: number) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>(`/api/notes/${id}/delete`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const restoreNote = async (id: number) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ note: NoteItem }>(`/api/notes/${id}/restore`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
    })
  }

  const purgeNote = async (id: number) => {
    const authHeader = useAuthHeaderOrThrow()

    return await $fetch<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: authHeader,
      },
    })
  }

  return {
    listNotes,
    createNote,
    getNote,
    updateNote,
    toggleFavorite,
    moveToRecycle,
    restoreNote,
    purgeNote,
  }
}
