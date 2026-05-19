import { requireAdminUser } from '../../../utils/auth-session'
import { createError } from 'h3'
import { createBroadcastNotification } from '../../../utils/notification'
import { logAdminAction } from '../../../utils/admin-log'

export default defineEventHandler(async (event) => {
  const { user: admin } = await requireAdminUser(event)

  const body = await readBody<{ title?: string; content?: string }>(event)
  const title = body.title?.trim()
  const content = body.content?.trim()

  if (!title) {
    throw createError({ statusCode: 400, message: '标题不能为空' })
  }
  if (!content) {
    throw createError({ statusCode: 400, message: '内容不能为空' })
  }

  const notification = await createBroadcastNotification(title, content, admin.id)

  await logAdminAction(admin.id, 'NOTIFICATION_BROADCAST', undefined, {
    notificationId: notification.id,
    title,
  })

  return {
    notification: {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      createdAt: notification.createdAt.toISOString(),
    },
  }
})
