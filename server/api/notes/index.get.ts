import type { Prisma } from '../../../generated/prisma/client'
import { getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { normalizeKeyword, requireNoteOwner, parsePaginationParams } from '../../utils/notes'
import type { ParsedPagination } from '../../utils/notes'

type NotesQuery = {
  mode?: 'all' | 'favorite' | 'deleted'
  q?: string
  page?: string | string[]
  pageSize?: string | string[]
}

export default defineEventHandler(async (event) => {
  const userId = await requireNoteOwner(event)
  const query = getQuery(event) as NotesQuery
  const mode = query.mode || 'all'
  const keyword = normalizeKeyword(query.q)
  const { page, pageSize, offset, limit }: ParsedPagination = parsePaginationParams(
    query.page,
    query.pageSize,
  )

  if (mode === 'favorite') {
    // Own favorited note IDs + Favorite join table note IDs
    const ownFavoriteIds = await prisma.note.findMany({
      where: { userId, isDeleted: false, isFavorite: true },
      select: { id: true },
    })

    const favoritedIds = await prisma.favorite.findMany({
      where: { userId },
      select: { noteId: true },
    })

    const allIds = [...new Set([...ownFavoriteIds.map((n) => n.id), ...favoritedIds.map((f) => f.noteId)])]

    if (allIds.length === 0) {
      return { notes: [], total: 0, page, pageSize, totalPages: 0 }
    }

    const where: Prisma.NoteWhereInput = {
      id: { in: allIds },
      isDeleted: false,
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { rawText: { contains: keyword } },
        { tags: { some: { tag: { name: { contains: keyword } } } } },
      ]
    }

    const [notes, total] = await prisma.$transaction([
      prisma.note.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: { select: { id: true, username: true, avatarUrl: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.note.count({ where }),
    ])

    // Mark which notes are favorited by current user
    const favoritedSet = new Set(favoritedIds.map((f) => f.noteId))
    const notesWithMeta = notes.map((n) => ({
      ...n,
      isFavorite: n.isFavorite || favoritedSet.has(n.id),
    }))

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return {
      notes: notesWithMeta,
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  const where: Prisma.NoteWhereInput = {
    userId,
  }

  if (mode === 'deleted') {
    where.isDeleted = true
  } else {
    where.isDeleted = false
  }

  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { rawText: { contains: keyword } },
      { tags: { some: { tag: { name: { contains: keyword } } } } },
    ]
  }

  const [notes, total] = await prisma.$transaction([
    prisma.note.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.note.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    notes,
    total,
    page,
    pageSize,
    totalPages,
  }
})
