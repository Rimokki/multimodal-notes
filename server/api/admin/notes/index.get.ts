import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { parsePaginationParams, normalizeKeyword } from '../../../utils/notes'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const query = getQuery(event)
  const keyword = normalizeKeyword(query.keyword as string | undefined)
  const { page, pageSize, offset, limit } = parsePaginationParams(query.page, query.pageSize)

  const where = keyword
    ? {
        OR: [
          { title: { contains: keyword } },
          { rawText: { contains: keyword } },
          { owner: { email: { contains: keyword } } },
          { owner: { username: { contains: keyword } } },
        ],
      }
    : {}

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        rawText: true,
        isDeleted: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        owner: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    }),
    prisma.note.count({ where }),
  ])

  return {
    notes: notes.map((n) => ({
      ...n,
      excerpt: n.rawText?.slice(0, 200) ?? '',
    })),
    total,
    page,
    pageSize,
  }
})
