import { prisma } from '../../utils/prisma'
import { requireAccessUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)

  const query = getQuery(event)
  const filter = (query.filter as string) || 'all'
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20))
  const skip = (page - 1) * pageSize

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { userId: user.id },
        { type: 'BROADCAST' },
      ],
    },
    include: {
      reads: { where: { userId: user.id }, select: { id: true } },
      sender: { select: { id: true, username: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
  })

  let items = notifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    isRead: n.reads.length > 0,
    createdAt: n.createdAt.toISOString(),
    sender: n.sender,
  }))

  if (filter === 'read') {
    items = items.filter(n => n.isRead)
  } else if (filter === 'unread') {
    items = items.filter(n => !n.isRead)
  }

  const totalCount = await prisma.notification.count({
    where: {
      OR: [
        { userId: user.id },
        { type: 'BROADCAST' },
      ],
    },
  })

  return {
    notifications: items,
    total: totalCount,
    page,
    pageSize,
  }
})
