import { prisma } from '../../../utils/prisma'
import { requireAccessUser } from '../../../utils/auth-session'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { user } = await requireAccessUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid notification id' })
  }

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, userId: true, type: true },
  })

  if (!notification) {
    throw createError({ statusCode: 404, message: 'Notification not found' })
  }

  const isTargeted = notification.type === 'TARGETED' && notification.userId === user.id
  const isBroadcast = notification.type === 'BROADCAST'
  if (!isTargeted && !isBroadcast) {
    throw createError({ statusCode: 403, message: 'Access denied' })
  }

  await prisma.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId: id,
        userId: user.id,
      },
    },
    create: { notificationId: id, userId: user.id },
    update: {},
  })

  return { success: true }
})
