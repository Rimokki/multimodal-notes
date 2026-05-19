import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { logAdminAction } from '../../../utils/admin-log'

export default defineEventHandler(async (event) => {
  const { user: admin } = await requireAdminUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: '无效的通知 ID' })
  }

  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) {
    throw createError({ statusCode: 404, statusMessage: '通知不存在' })
  }

  await prisma.notification.delete({ where: { id } })

  await logAdminAction(admin.id, 'NOTIFICATION_DELETE', id, {
    title: notification.title,
  })

  return { success: true }
})
