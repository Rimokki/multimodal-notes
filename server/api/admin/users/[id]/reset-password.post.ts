import { prisma } from '../../../../utils/prisma'
import { requireAdminUser } from '../../../../utils/auth-session'
import { createAuthError, hashPassword } from '../../../../utils/auth'
import { logAdminAction } from '../../../../utils/admin-log'
import { createTargetedNotification } from '../../../../utils/notification'

export default defineEventHandler(async (event) => {
  const { user: admin } = await requireAdminUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createAuthError(400, 'Invalid user id')
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, username: true, role: true },
  })
  if (!target) {
    throw createAuthError(404, 'User not found')
  }
  if (target.role === 'ADMIN') {
    throw createAuthError(400, 'Cannot reset admin password')
  }

  const newHash = await hashPassword('12345678')

  await prisma.user.update({
    where: { id },
    data: { passwordHash: newHash },
  })

  const targetLabel = (target.username || target.email) ?? `#${id}`
  await logAdminAction(admin.id, 'PASSWORD_RESET', id, {
    target: targetLabel,
  })

  await createTargetedNotification(
    '密码已重置',
    '管理员已重置您的密码为默认密码12345678，请尽快修改密码。',
    admin.id,
    id,
  )

  return { success: true }
})
