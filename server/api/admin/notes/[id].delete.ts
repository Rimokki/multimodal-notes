import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { createAuthError } from '../../../utils/auth'
import { logAdminAction } from '../../../utils/admin-log'

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
  await logAdminAction(event, admin.id, 'NOTE_DELETE', id, {
    title: note.title,
    owner: ownerLabel,
  })

  return { success: true }
})
