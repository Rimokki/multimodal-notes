export type CommunityNoteItem = {
  id: number
  userId: number | null
  title: string
  content: string
  rawText: string | null
  isFavorite: boolean
  isDeleted: boolean
  isPublic: boolean
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  owner: { id: number; username: string | null; avatarUrl: string | null } | null
  tags?: { tag: { id: number; name: string } }[]
  likeCount: number
  isLiked: boolean
  isOwner?: boolean
}

export type ListCommunityResponse = {
  notes: CommunityNoteItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function useCommunityApi() {
  const { request } = useApiFetch()

  const listCommunityNotes = async (
    keyword = '',
    page = 1,
    pageSize = 12,
    sort: 'likes' | 'updatedAt' = 'updatedAt',
  ) => {
    return await request<ListCommunityResponse>('/api/community/notes', {
      method: 'GET',
      query: {
        q: keyword || undefined,
        page,
        pageSize,
        sort,
      },
    })
  }

  const toggleShare = async (noteId: number) => {
    return await request<{ note: { isPublic: boolean } }>(`/api/notes/${noteId}/share`, {
      method: 'POST',
    })
  }

  const toggleLike = async (noteId: number) => {
    return await request<{ liked: boolean; likeCount: number }>(
      `/api/community/notes/${noteId}/like`,
      { method: 'POST' },
    )
  }

  return {
    listCommunityNotes,
    toggleShare,
    toggleLike,
  }
}
