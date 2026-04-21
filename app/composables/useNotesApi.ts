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
  assets?: NoteAssetItem[]
}

export type NoteAssetItem = {
  id: number
  noteId: number
  userId: number
  kind: 'IMAGE' | 'AUDIO' | 'FILE'
  sourceType: 'UPLOAD' | 'EXTERNAL'
  storageKey: string | null
  url: string
  mimeType: string
  fileName: string | null
  fileExt: string | null
  sizeBytes: number
  width: number | null
  height: number | null
  durationMs: number | null
  checksum: string | null
  ocrText: string | null
  status: 'PENDING' | 'READY' | 'FAILED'
  sortOrder: number
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

type UploadableFile = {
  name: string
  size: number
  type: string
  lastModified: number
  content: string
}

async function serializeFileToDataUrl(file: File): Promise<UploadableFile> {
  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Invalid file payload'))
    }

    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    content,
  }
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

  const uploadNoteAsset = async (id: number, file: File) => {
    const authHeader = useAuthHeaderOrThrow()
    const payloadFile = await serializeFileToDataUrl(file)

    return await $fetch<{ asset: NoteAssetItem }>(`/api/notes/${id}/assets/upload`, {
      method: 'POST',
      body: {
        file: payloadFile,
      },
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
    uploadNoteAsset,
  }
}
