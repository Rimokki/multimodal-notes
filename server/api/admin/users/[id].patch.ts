import { prisma } from '../../../utils/prisma'
import { requireAdminUser } from '../../../utils/auth-session'
import { createAuthError } from '../../../utils/auth'
import { logAdminAction } from '../../../utils/admin-log'

type UpdateBody = {
  isActive?: boolean
  role?: 'USER' | 'ADMIN'
}

export default defineEventHandler(async (event) => {
  const { user: admin } = await requireAdminUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createAuthError(400, 'Invalid user id')
  }

  if (id === admin.id) {
    throw createAuthError(400, 'Cannot modify your own account')
  }

  const body = await readBody<UpdateBody>(event)
  const data: Record<string, unknown> = {}

  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive
  }
  if (body.role === 'USER' || body.role === 'ADMIN') {
    data.role = body.role
  }

  if (Object.keys(data).length === 0) {
    throw createAuthError(400, 'No valid fields to update')
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true, username: true, isActive: true, role: true } })
  const targetLabel = (target?.username || target?.email) ?? `#${id}`

  const updated = await prisma.user.update({
    where: { id },
    data,
  })

  const changes: string[] = []
  if (data.isActive !== undefined) {
    changes.push(`账号状态: ${target?.isActive ?? '未知'} → ${data.isActive}`)
  }
  if (data.role !== undefined) {
    changes.push(`角色: ${target?.role ?? '未知'} → ${data.role}`)
  }
  await logAdminAction(event, admin.id, 'USER_UPDATE', id, {
    target: targetLabel,
    changes,
  })

  return {
    user: {
      id: updated.id,
      email: updated.email,
      username: updated.username,
      role: updated.role,
      isActive: updated.isActive,
    },
  }
})
