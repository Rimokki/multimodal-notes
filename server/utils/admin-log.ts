import type { H3Event } from 'h3'
import type { AdminAction } from '../../generated/prisma/enums'
import { getHeader, getRequestIP } from 'h3'
import { prisma } from './prisma'

function getClientIp(event: H3Event): string | null {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]
    if (firstIp?.trim()) return firstIp.trim()
  }
  return getRequestIP(event, { xForwardedFor: false }) || null
}

export async function logAdminAction(
  event: H3Event,
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
      ipAddress: getClientIp(event),
    },
  })
}
