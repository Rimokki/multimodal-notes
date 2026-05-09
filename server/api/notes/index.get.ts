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

  const where: Prisma.NoteWhereInput = {
    userId,
  }

  if (mode === 'favorite') {
    where.isDeleted = false
    where.isFavorite = true
  } else if (mode === 'deleted') {
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
