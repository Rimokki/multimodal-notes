import type { AdminAction } from '../../generated/prisma/enums'
import { prisma } from './prisma'

export async function logAdminAction(
  adminId: number,
  action: AdminAction,
  targetId?: number,
  detail?: Record<string, unknown>,
) {
  await prisma.adminLog.create({
    data: {
      adminId,
      action,
      targetId: targetId ?? null,
      detail: detail ? JSON.stringify(detail) : null,
    },
  })
}
