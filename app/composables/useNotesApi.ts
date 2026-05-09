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
  tags?: NoteTagItem[]
}

export type NoteTagItem = {
  tag: { id: number; name: string }
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

export function useNotesApi() {
  const { request } = useApiFetch()

  const listNotes = async (mode: NotesMode, keyword = '', page = 1, pageSize = 5) => {
    return await request<ListNotesResponse>('/api/notes', {
      method: 'GET',
      query: {
        mode,
        q: keyword || undefined,
        page,
        pageSize,
      },
    })
  }

  const createNote = async (payload?: { title?: string; content?: string }) => {
    return await request<{ note: NoteItem }>('/api/notes', {
      method: 'POST',
      body: payload,
    })
  }

  const getNote = async (id: number) => {
    return await request<{ note: NoteItem }>(`/api/notes/${id}`, {
      method: 'GET',
    })
  }

  const updateNote = async (id: number, payload: { title?: string; content?: string }) => {
    return await request<{ note: NoteItem }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: payload,
    })
  }

  const toggleFavorite = async (id: number, isFavorite?: boolean) => {
    return await request<{ note: NoteItem }>(`/api/notes/${id}/favorite`, {
      method: 'POST',
      body: {
        isFavorite,
      },
    })
  }

  const moveToRecycle = async (id: number) => {
    return await request<{ note: NoteItem }>(`/api/notes/${id}/delete`, {
      method: 'POST',
    })
  }

  const restoreNote = async (id: number) => {
    return await request<{ note: NoteItem }>(`/api/notes/${id}/restore`, {
      method: 'POST',
    })
  }

  const purgeNote = async (id: number) => {
    return await request<{ success: boolean }>(`/api/notes/${id}`, {
      method: 'DELETE',
    })
  }

  const uploadNoteAsset = async (id: number, file: File) => {
    const payloadFile = await serializeFileToDataUrl(file)

    return await request<{ asset: NoteAssetItem }>(`/api/notes/${id}/assets/upload`, {
      method: 'POST',
      body: {
        file: payloadFile,
      },
    })
  }

  const getNoteTags = async (noteId: number) => {
    return await request<{ tags: { id: number; name: string }[] }>(`/api/notes/${noteId}/tags`, {
      method: 'GET',
    })
  }

  const addNoteTag = async (noteId: number, tagId: number) => {
    return await request<{ tag: { id: number; name: string } }>(`/api/notes/${noteId}/tags`, {
      method: 'POST',
      body: { tagId },
    })
  }

  const removeNoteTag = async (noteId: number, tagId: number) => {
    return await request<{ success: boolean }>(`/api/notes/${noteId}/tags/${tagId}`, {
      method: 'DELETE',
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
    getNoteTags,
    addNoteTag,
    removeNoteTag,
  }
}
