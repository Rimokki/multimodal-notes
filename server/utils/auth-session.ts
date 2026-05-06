import type { H3Event } from 'h3'
import { deleteCookie, getCookie, getHeader, getRequestIP, setCookie } from 'h3'
import { prisma } from './prisma'
import {
  createAuthError,
  generateRefreshToken,
  getAuthConfig,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from './auth'

type UserInfo = {
  id: number
  email: string
  username: string | null
  avatarUrl: string | null
  isActive: boolean
  role: string
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export function toUserInfo(user: UserInfo) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

function getClientIp(event: H3Event): string | null {
  const forwarded = getHeader(event, 'x-forwarded-for')
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]
    if (firstIp?.trim()) return firstIp.trim()
  }
  return getRequestIP(event, { xForwardedFor: false }) || null
}

function getSessionCookieOptions(event: H3Event, maxAge: number) {
  const config = getAuthConfig()
  const secure = process.env.NODE_ENV === 'production' ? true : config.authCookieSecure

  return {
    httpOnly: true as const,
    secure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function clearRefreshCookie(event: H3Event) {
  const config = getAuthConfig()
  deleteCookie(event, config.authRefreshCookieName, {
    path: '/',
  })
}

export async function createSessionAndTokens(event: H3Event, user: UserInfo) {
  const config = getAuthConfig()
  const refreshToken = generateRefreshToken()
  const refreshTokenHash = hashRefreshToken(refreshToken)
  const expiresAt = new Date(Date.now() + config.authRefreshTokenTtlSec * 1000)

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      userAgent: getHeader(event, 'user-agent') || null,
      ipAddress: getClientIp(event),
      expiresAt,
    },
  })

  const accessToken = signAccessToken(
    {
      sub: user.id,
      email: user.email,
      sid: session.id,
    },
    config.authSecret,
    config.authAccessTokenTtlSec,
  )

  setCookie(
    event,
    config.authRefreshCookieName,
    refreshToken,
    getSessionCookieOptions(event, config.authRefreshTokenTtlSec),
  )

  return {
    accessToken,
    accessTokenExpiresInSec: config.authAccessTokenTtlSec,
    sessionId: session.id,
  }
}

export async function rotateRefreshSession(event: H3Event) {
  const config = getAuthConfig()
  const refreshToken = getCookie(event, config.authRefreshCookieName)
  if (!refreshToken) {
    throw createAuthError(401, 'Missing refresh token')
  }

  const refreshTokenHash = hashRefreshToken(refreshToken)
  const now = new Date()
  const nextRefreshToken = generateRefreshToken()
  const nextRefreshHash = hashRefreshToken(nextRefreshToken)
  const nextExpiresAt = new Date(Date.now() + config.authRefreshTokenTtlSec * 1000)

  const result = await prisma.$transaction(async (tx) => {
    const currentSession = await tx.userSession.findUnique({
      where: { refreshTokenHash },
      include: { user: true },
    })

    if (!currentSession) {
      throw createAuthError(401, 'Invalid refresh token')
    }

    if (currentSession.revokedAt || currentSession.expiresAt <= now) {
      throw createAuthError(401, 'Refresh token expired')
    }

    if (!currentSession.user.isActive) {
      throw createAuthError(403, '用户已被禁用，请联系管理员')
    }

    await tx.userSession.update({
      where: { id: currentSession.id },
      data: { revokedAt: now },
    })

    const nextSession = await tx.userSession.create({
      data: {
        userId: currentSession.userId,
        refreshTokenHash: nextRefreshHash,
        userAgent: getHeader(event, 'user-agent') || null,
        ipAddress: getClientIp(event),
        expiresAt: nextExpiresAt,
      },
    })

    const accessToken = signAccessToken(
      {
        sub: currentSession.user.id,
        email: currentSession.user.email,
        sid: nextSession.id,
      },
      config.authSecret,
      config.authAccessTokenTtlSec,
    )

    return {
      accessToken,
      user: currentSession.user,
    }
  })

  setCookie(
    event,
    config.authRefreshCookieName,
    nextRefreshToken,
    getSessionCookieOptions(event, config.authRefreshTokenTtlSec),
  )

  return {
    accessToken: result.accessToken,
    accessTokenExpiresInSec: config.authAccessTokenTtlSec,
    user: toUserInfo(result.user),
  }
}

export async function revokeCurrentSessionByCookie(event: H3Event) {
  const config = getAuthConfig()
  const refreshToken = getCookie(event, config.authRefreshCookieName)
  if (!refreshToken) {
    clearRefreshCookie(event)
    return
  }

  const refreshTokenHash = hashRefreshToken(refreshToken)
  await prisma.userSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })

  clearRefreshCookie(event)
}

export async function requireAccessUser(event: H3Event) {
  const config = getAuthConfig()
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createAuthError(401, 'Missing access token')
  }

  const token = authHeader.slice(7).trim()
  const payload = verifyAccessToken(token, config.authSecret)
  if (!payload) {
    throw createAuthError(401, 'Invalid access token')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  })

  if (!user || !user.isActive) {
    throw createAuthError(401, 'User not available')
  }

  return {
    user: toUserInfo(user),
    sessionId: payload.sid,
  }
}

export async function requireAdminUser(event: H3Event) {
  const { user, sessionId } = await requireAccessUser(event)
  if (user.role !== 'ADMIN') {
    throw createAuthError(403, 'Admin access required')
  }
  return { user, sessionId }
}
