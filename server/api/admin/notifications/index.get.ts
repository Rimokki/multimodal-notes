import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const where = { type: 'BROADCAST' as const }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        sender: { select: { id: true, username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications: notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      content: n.content,
      createdAt: n.createdAt.toISOString(),
      sender: n.sender,
    })),
    total,
    page,
    pageSize,
  }
})
