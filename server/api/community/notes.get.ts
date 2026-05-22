import type { Prisma } from '../../../generated/prisma/client'
import { getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { normalizeKeyword, parsePaginationParams } from '../../utils/notes'
import { requireAccessUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)
  const query = getQuery(event) as {
    q?: string
    page?: string | string[]
    pageSize?: string | string[]
    sort?: 'likes' | 'updatedAt'
  }
  const keyword = normalizeKeyword(query.q)
  const sort = query.sort || 'updatedAt'
  const { page, pageSize, offset, limit } = parsePaginationParams(query.page, query.pageSize)

  const where: Prisma.NoteWhereInput = {
    isPublic: true,
    isDeleted: false,
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { rawText: { contains: keyword } },
      { tags: { some: { tag: { name: { contains: keyword } } } } },
    ]
  }

  const orderBy =
    sort === 'likes'
      ? { likes: { _count: 'desc' as const }, updatedAt: 'desc' as const }
      : { updatedAt: 'desc' as const }

  const [notes, total] = await prisma.$transaction([
    prisma.note.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy,
      include: {
        owner: { select: { id: true, username: true, avatarUrl: true } },
        tags: { include: { tag: true } },
        _count: { select: { likes: true } },
      },
    }),
    prisma.note.count({ where }),
  ])

  const noteIds = notes.map((n) => n.id)
  const userLikes = await prisma.like.findMany({
    where: { userId: user.id, noteId: { in: noteIds } },
  })
  const likedNoteIds = new Set(userLikes.map((l) => l.noteId))

  const notesWithMeta = notes.map((n) => ({
    ...n,
    likeCount: n._count.likes,
    isLiked: likedNoteIds.has(n.id),
    _count: undefined,
  }))

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    notes: notesWithMeta,
    total,
    page,
    pageSize,
    totalPages,
  }
})
