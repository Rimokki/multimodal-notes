export type TagItem = {
  id: number
  userId: number
  name: string
  createdAt: string
  updatedAt: string
}

export function useTagsApi() {
  const { request } = useApiFetch()

  const listTags = async (keyword?: string) => {
    return await request<{ tags: TagItem[] }>('/api/tags', {
      method: 'GET',
      query: keyword ? { q: keyword } : undefined,
    })
  }

  const createTag = async (name: string) => {
    return await request<{ tag: TagItem }>('/api/tags', {
      method: 'POST',
      body: { name },
    })
  }

  const deleteTag = async (id: number) => {
    return await request<{ success: boolean }>(`/api/tags/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    listTags,
    createTag,
    deleteTag,
  }
}
