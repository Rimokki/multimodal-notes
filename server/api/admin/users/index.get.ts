import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { parsePaginationParams, normalizeKeyword } from '../../../utils/notes'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const query = getQuery(event)
  const keyword = normalizeKeyword(query.keyword as string | undefined)
  const { page, pageSize, offset, limit } = parsePaginationParams(query.page, query.pageSize)

  const where: any = {}
  if (keyword) {
    where.OR = [{ email: { contains: keyword } }, { username: { contains: keyword } }]
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { notes: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      isActive: u.isActive,
      noteCount: u._count.notes,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    })),
    total,
    page,
    pageSize,
  }
})
