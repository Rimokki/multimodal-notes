import { prisma } from '../../utils/prisma'
import { createAuthError } from '../../utils/auth'
import { parseNoteId, tryRequireNoteOwner } from '../../utils/notes'

export default defineEventHandler(async (event) => {
  const currentUserId = await tryRequireNoteOwner(event)
  const noteId = parseNoteId(event)

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        currentUserId !== null ? { userId: currentUserId } : undefined,
        { isPublic: true, isDeleted: false },
      ].filter(Boolean) as any,
    },
    include: {
      owner: { select: { id: true, username: true, avatarUrl: true } },
      assets: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      tags: { include: { tag: true } },
      _count: { select: { likes: true } },
    },
  })

  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  const isOwner = currentUserId !== null && note.userId === currentUserId

  let isLiked = false
  let isFavorited = note.isFavorite
  if (currentUserId) {
    const [like, favorite] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_noteId: { userId: currentUserId, noteId } },
      }),
      isOwner
        ? null
        : prisma.favorite.findUnique({
            where: { userId_noteId: { userId: currentUserId, noteId } },
          }),
    ])
    isLiked = !!like
    if (favorite) isFavorited = true
  }

  return {
    note: {
      ...note,
      isOwner,
      isLiked,
      isFavorite: isFavorited,
      likeCount: note._count.likes,
      _count: undefined,
    },
  }
})
