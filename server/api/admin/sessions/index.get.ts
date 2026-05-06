import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { parsePaginationParams } from '../../../utils/notes'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const query = getQuery(event)
  const { page, pageSize, offset, limit } = parsePaginationParams(query.page, query.pageSize)

  const [sessions, total] = await Promise.all([
    prisma.userSession.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
          },
        },
      },
    }),
    prisma.userSession.count(),
  ])

  return {
    sessions: sessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      expiresAt: s.expiresAt,
      revokedAt: s.revokedAt,
      createdAt: s.createdAt,
      isExpired: s.expiresAt <= new Date(),
      isRevoked: s.revokedAt !== null,
      user: s.user,
    })),
    total,
    page,
    pageSize,
  }
})
