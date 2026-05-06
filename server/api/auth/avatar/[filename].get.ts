import type { H3Event } from 'h3'
import { getCookie, getRouterParam, sendStream } from 'h3'
import { prisma } from '../../../utils/prisma'
import { createAuthError, getAuthConfig, hashRefreshToken } from '../../../utils/auth'
import { requireAccessUser } from '../../../utils/auth-session'

function parseAvatarFilename(event: H3Event): string {
  const raw = getRouterParam(event, 'filename')?.trim()
  if (!raw || raw.includes('/') || raw.includes('\\') || raw.includes('..')) {
    throw createAuthError(400, 'Invalid avatar filename')
  }

  return raw
}

async function resolveUserId(event: H3Event): Promise<number> {
  try {
    const { user } = await requireAccessUser(event)
    return user.id
  } catch {
    const config = getAuthConfig()
    const refreshToken = getCookie(event, config.authRefreshCookieName)

    if (!refreshToken) {
      throw createAuthError(401, 'Missing access token')
    }

    const refreshTokenHash = hashRefreshToken(refreshToken)
    const session = await prisma.userSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    })

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      throw createAuthError(401, 'Invalid session')
    }

    return session.user.id
  }
}

export default defineEventHandler(async (event) => {
  const userId = await resolveUserId(event)
  const filename = parseAvatarFilename(event)
  const avatarLocation = `users/${userId}/avatar`

  const stream = await retrieveFileLocally(event, filename, avatarLocation)
  return sendStream(event, stream as any)
})
