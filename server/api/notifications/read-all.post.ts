import { prisma } from '../../utils/prisma'
import { requireAccessUser } from '../../utils/auth-session'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)

  const allNotifs = await prisma.notification.findMany({
    where: {
      OR: [{ userId: user.id }, { type: 'BROADCAST' }],
    },
    select: { id: true },
  })

  if (allNotifs.length === 0) {
    return { success: true, count: 0 }
  }

  const allIds = allNotifs.map((n) => n.id)

  const readNotifs = await prisma.notificationRead.findMany({
    where: {
      userId: user.id,
      notificationId: { in: allIds },
    },
    select: { notificationId: true },
  })

  const readIds = new Set(readNotifs.map((r) => r.notificationId))
  const unreadIds = allIds.filter((id) => !readIds.has(id))

  if (unreadIds.length > 0) {
    await prisma.notificationRead.createMany({
      data: unreadIds.map((notificationId) => ({
        notificationId,
        userId: user.id,
      })),
    })
  }

  return { success: true, count: unreadIds.length }
})
