import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { createAuthError } from '../../../utils/auth'
import { logAdminAction } from '../../../utils/admin-log'
import { createTargetedNotification } from '../../../utils/notification'

export default defineEventHandler(async (event) => {
  const { user: admin } = await requireAdminUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createAuthError(400, 'Invalid note id')
  }

  const note = await prisma.note.findUnique({
    where: { id },
    include: { owner: { select: { email: true, username: true } } },
  })
  if (!note) {
    throw createAuthError(404, 'Note not found')
  }

  await prisma.note.delete({ where: { id } })

  const ownerLabel = note.owner?.username || note.owner?.email || '已注销用户'
  await logAdminAction(admin.id, 'NOTE_DELETE', id, {
    title: note.title,
    owner: ownerLabel,
  })

  if (note.userId) {
    await createTargetedNotification(
      '笔记被删除',
      `管理员已删除您的笔记「${note.title || '无标题'}」，如有疑问请联系管理员。`,
      admin.id,
      note.userId,
    )
  }

  return { success: true }
})
